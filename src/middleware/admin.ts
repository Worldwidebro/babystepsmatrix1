import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Verify the token is a service role key
    if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(403).json({ error: 'Invalid admin credentials' })
    }

    next()
  } catch (error) {
    console.error('Admin auth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 