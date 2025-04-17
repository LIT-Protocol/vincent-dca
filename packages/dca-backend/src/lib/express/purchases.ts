import { Response } from 'express';

import { PurchasedCoin } from '../mongo/models/PurchasedCoin';

import type { ExpressAuthHelpers } from '@lit-protocol/vincent-sdk';

export const handleListPurchasesRoute = async (
  req: ExpressAuthHelpers['AuthenticatedRequest'],
  res: Response
) => {
  const walletAddress = req.user.pkp.ethAddress;

  const purchases = await PurchasedCoin.find({ walletAddress })
    .sort({
      purchasedAt: -1,
    })
    .lean();

  if (purchases.length === 0) {
    res.status(404).json({ error: `No purchases found  for wallet address ${walletAddress}` });
    return;
  }

  res.json({ data: purchases, success: true });
};
