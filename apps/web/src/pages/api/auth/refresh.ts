import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RefreshResponse>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { refreshToken } = req.body as RefreshRequest;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    ) as any;

    // Generate new access token
    const newToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' },
    );

    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
