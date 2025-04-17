import { Job } from '@whisthub/agenda';
import consola from 'consola';
import { ethers } from 'ethers';

import { Coin, getTopBaseMemeCoin } from './baseMemeCoinLoader';
import { getEthereumPriceUsd } from './ethPriceLoader';
import {
  getAddressesByChainId,
  getErc20Info,
  getEstimatedGasForApproval,
  getEstimatedUniswapCosts,
} from './utils';
import { getERC20Contract, getExistingUniswapAllowance } from './utils/get-erc20-info';
import { getErc20ApprovalToolClient, getUniswapToolClient } from './vincentTools';
import { env } from '../../../env';
import { PurchasedCoin } from '../../../mongo/models/PurchasedCoin';

export type JobType = Job<JobParams>;
export type JobParams = {
  name: string;
  purchaseAmount: number;
  purchaseIntervalHuman: string;
  updatedAt: Date;
  vincentAppVersion: number;
  walletAddress: string;
};

const { BASE_RPC_URL } = env;

const BASE_CHAIN_ID = '8453';

async function addApproval({
  baseProvider,
  nativeEthBalance,
  vincentAppVersion,
  walletAddress,
  WETH_ADDRESS,
  wethAmount,
  wEthDecimals,
}: {
  WETH_ADDRESS: string;
  baseProvider: ethers.providers.StaticJsonRpcProvider;
  nativeEthBalance: ethers.BigNumber;
  vincentAppVersion: number;
  wEthDecimals: ethers.BigNumber;
  walletAddress: string;
  wethAmount: number;
}): Promise<ethers.BigNumber> {
  const approvalGasCost = await getEstimatedGasForApproval(
    baseProvider,
    BASE_CHAIN_ID,
    WETH_ADDRESS!,
    (wethAmount * 5).toFixed(18).toString(),
    wEthDecimals.toString(),
    walletAddress
  );

  const requiredApprovalGasCost = approvalGasCost.estimatedGas.mul(approvalGasCost.maxFeePerGas);

  consola.log('requiredApprovalGasCost', requiredApprovalGasCost);

  if (nativeEthBalance.lt(requiredApprovalGasCost)) {
    throw new Error(
      `Not enough ETH to pay for gas for token approval - balance is ${nativeEthBalance.toString()}, needed ${requiredApprovalGasCost.toString()}`
    );
  }

  const erc20ApprovalToolClient = getErc20ApprovalToolClient({ vincentAppVersion });
  const toolExecutionResult = await erc20ApprovalToolClient.execute({
    amountIn: (wethAmount * 5).toFixed(18).toString(), // Approve 5x the amount to spend so we don't wait for approval tx's every time we run
    chainId: BASE_CHAIN_ID,
    pkpEthAddress: walletAddress,
    rpcUrl: BASE_RPC_URL,
    tokenIn: WETH_ADDRESS!,
  });

  consola.trace('ERC20 Approval Vincent Tool Response:', toolExecutionResult);
  consola.log('Logs from approval tool exec:', toolExecutionResult.logs);

  const approvalResult = JSON.parse(toolExecutionResult.response as string);
  if (approvalResult.status === 'success' && approvalResult.approvalTxHash) {
    consola.log('Approval successful. Waiting for transaction confirmation...');

    const receipt = await baseProvider.waitForTransaction(approvalResult.approvalTxHash);

    if (receipt.status === 1) {
      consola.log('Approval transaction confirmed:', approvalResult.approvalTxHash);
    } else {
      consola.error('Approval transaction failed:', approvalResult.approvalTxHash);
      throw new Error(`Approval transaction failed for hash: ${approvalResult.approvalTxHash}`);
    }
  } else {
    consola.log('Approval action failed');
    throw new Error(JSON.stringify(approvalResult, null, 2));
  }

  return approvalGasCost.estimatedGas.mul(approvalGasCost.maxFeePerGas);
}

async function handleSwapExecution({
  approvalGasCost,
  baseProvider,
  nativeEthBalance,
  tokenOutInfo,
  topCoin,
  vincentAppVersion,
  walletAddress,
  WETH_ADDRESS,
  wethAmount,
  wEthBalance,
  wEthDecimals,
}: {
  WETH_ADDRESS: string;
  approvalGasCost: ethers.BigNumber;
  baseProvider: ethers.providers.StaticJsonRpcProvider;
  nativeEthBalance: ethers.BigNumber;
  tokenOutInfo: { decimals: ethers.BigNumber };
  topCoin: Coin;
  vincentAppVersion: number;
  wEthBalance: ethers.BigNumber;
  wEthDecimals: ethers.BigNumber;
  walletAddress: string;
  wethAmount: number;
}): Promise<void> {
  const { gasCost, swapCost } = await getEstimatedUniswapCosts({
    amountIn: wethAmount.toFixed(18).toString(),
    pkpEthAddress: walletAddress,
    tokenInAddress: WETH_ADDRESS,
    tokenInDecimals: wEthDecimals,
    tokenOutAddress: topCoin.coinAddress,
    tokenOutDecimals: tokenOutInfo.decimals,
    userChainId: BASE_CHAIN_ID,
    userRpcProvider: baseProvider,
  });

  if (swapCost.amountOutMin.gt(wEthBalance)) {
    throw new Error(
      `Not enough WETH to swap - balance is ${wEthBalance.toString()}, needed ${swapCost.amountOutMin.toString()}`
    );
  }

  const requiredSwapGasCost = gasCost.estimatedGas.mul(gasCost.maxFeePerGas);
  if (!nativeEthBalance.sub(approvalGasCost).gte(requiredSwapGasCost)) {
    throw new Error(
      `Not enough ETH to pay for gas for swap - balance is ${nativeEthBalance.toString()}, needed ${requiredSwapGasCost.toString()}`
    );
  }

  const uniswapToolClient = getUniswapToolClient({ vincentAppVersion });
  const uniswapSwapToolResponse = await uniswapToolClient.execute({
    amountIn: wethAmount.toFixed(18).toString(),
    chainId: BASE_CHAIN_ID,
    pkpEthAddress: walletAddress,
    rpcUrl: BASE_RPC_URL,
    tokenIn: WETH_ADDRESS,
    tokenOut: topCoin.coinAddress,
  });

  consola.trace('Swap Vincent Tool Response:', uniswapSwapToolResponse);
  consola.log('Logs from swap tool exec:', uniswapSwapToolResponse.logs);

  const swapResult = JSON.parse(uniswapSwapToolResponse.response as string);

  if (swapResult.status === 'success' && swapResult.swapTxHash) {
    consola.log('Swap successful. Waiting for transaction confirmation...');

    const receipt = await baseProvider.waitForTransaction(swapResult.swapTxHash);

    if (receipt.status === 1) {
      consola.log('Swap transaction confirmed:', swapResult.swapTxHash);
    } else {
      consola.error('Swap transaction failed:', swapResult.swapTxHash);
      throw new Error(`Swap transaction failed for hash: ${swapResult.swapTxHash}`);
    }
  } else {
    consola.log('Swap action failed', swapResult);
    throw new Error(JSON.stringify(swapResult, null, 2));
  }

  return swapResult.swapTxHash;
}

export async function executeDCASwap(job: JobType): Promise<void> {
  try {
    const {
      _id,
      data: { purchaseAmount, vincentAppVersion, walletAddress },
    } = job.attrs;

    consola.log('Starting DCA swap job...', {
      _id,
      purchaseAmount,
      walletAddress,
    });

    // Fetch top coin first to get the target token
    consola.debug('Fetching top coin...');
    const topCoin = await getTopBaseMemeCoin();
    consola.debug('Got top coin:', topCoin);

    // FIXME: This should be type-safe
    const { WETH_ADDRESS } = getAddressesByChainId(BASE_CHAIN_ID);

    const baseProvider = new ethers.providers.StaticJsonRpcProvider(BASE_RPC_URL);

    const wethContract = getERC20Contract(WETH_ADDRESS!, baseProvider);

    const [
      wEthDecimals,
      wEthBalance,
      tokenOutInfo,
      ethPriceUsd,
      existingAllowance,
      nativeEthBalance,
    ] = await Promise.all([
      wethContract.decimals(),
      wethContract.balanceOf(walletAddress),
      getErc20Info(baseProvider, topCoin.coinAddress),
      getEthereumPriceUsd(),
      getExistingUniswapAllowance(
        BASE_CHAIN_ID,
        getERC20Contract(WETH_ADDRESS!, baseProvider),
        walletAddress
      ),
      baseProvider.getBalance(walletAddress),
    ]);

    if (!nativeEthBalance.gt(0)) {
      throw new Error(
        `No native eth balance on account ${walletAddress} - please fund this account with ETH to pay for gas`
      );
    }

    if (!wEthBalance.gt(0)) {
      throw new Error(
        `No wEth balance for account ${walletAddress} - please fund this account with WETH to swap`
      );
    }

    const usdAmountStr = purchaseAmount.toString();
    const wethPriceStr = ethPriceUsd.toString();

    const wethAmount = parseFloat(usdAmountStr) / parseFloat(wethPriceStr);
    const wethToSpend = ethers.utils.parseEther(wethAmount.toFixed(18));

    consola.log('Job details', {
      ethPriceUsd,
      purchaseAmount,
      usdAmountStr,
      walletAddress,
      wethAmount,
      wethPriceStr,
      existingAllowance: existingAllowance.toString(),
      nativeEthBalance: nativeEthBalance.toString(),
      wethToSpend: wethToSpend.toString(),
    });

    const needsApproval = existingAllowance.lte(wethToSpend);

    let approvalGasCost = ethers.BigNumber.from(0);

    if (needsApproval) {
      approvalGasCost = await addApproval({
        baseProvider,
        nativeEthBalance,
        vincentAppVersion,
        walletAddress,
        wethAmount,
        wEthDecimals,
        WETH_ADDRESS: WETH_ADDRESS!,
      });
    }

    const swapHash = await handleSwapExecution({
      approvalGasCost,
      baseProvider,
      nativeEthBalance,
      tokenOutInfo,
      topCoin,
      vincentAppVersion,
      walletAddress,
      wethAmount,
      wEthBalance,
      wEthDecimals,
      WETH_ADDRESS: WETH_ADDRESS!,
    });
    // Create a purchase record with all required fields
    const purchase = new PurchasedCoin({
      purchaseAmount,
      walletAddress,
      coinAddress: topCoin.coinAddress,
      name: topCoin.name,
      purchasePrice: topCoin.price,
      scheduleId: _id,
      success: true,
      symbol: topCoin.symbol,
      txHash: swapHash,
    });
    await purchase.save();

    consola.debug(
      `Successfully created purchase record for ${topCoin.symbol} with tx hash ${swapHash}`
    );
  } catch (e) {
    // Catch-and-rethrow is usually an anti-pattern, but Agenda doesn't log failed job reasons to console
    // so this is our chance to log the job failure details using Consola before we throw the error
    // to Agenda, which will write the failure reason to the Agenda job document in Mongo
    const err = e as Error;
    consola.error(err.message, err.stack);
    throw e;
  }
}
