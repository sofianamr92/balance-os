import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import type { NextFunction, Request, Response } from 'express';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing Bearer ID token.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Empty ID token.' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.email_verified) {
      res.status(403).json({ error: 'Forbidden: Verified email required.' });
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Firebase ID token verification failed:', err);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired ID token.' });
  }
}
