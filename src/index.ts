import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { supabase } from './config/supabase'
import { requireAuth, AuthenticatedRequest } from './middleware/auth'
import { requireAdmin } from './middleware/admin'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(helmet())
app.use(express.json())

// Health check endpoint (public)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

// Protected routes
app.get('/api/users', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
    
    if (error) throw error
    
    res.json(data)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user profile
app.get('/api/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user?.id)
      .single()
    
    if (error) throw error
    
    res.json(data)
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin routes
app.post('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ email }])
      .select()
    
    if (error) throw error
    
    res.status(201).json(data[0])
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.delete('/api/admin/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
}) 