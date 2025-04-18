import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// Extend the Express Session interface to allow for custom properties
declare module 'express-session' {
  interface SessionData {
    views?: number;
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Set up debugging middleware to log auth status
  app.use((req, res, next) => {
    console.log('Auth Debug - isAuthenticated:', req.isAuthenticated ? req.isAuthenticated() : 'method not available');
    console.log('Auth Debug - session:', req.session ? 'session exists' : 'no session');
    console.log('Auth Debug - cookies:', req.headers.cookie || 'no cookies');
    next();
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'projersey-session-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'voro.sid', // Custom name to avoid fingerprinting
    rolling: true, // Reset cookie expiration on each request
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax', // Helps with CSRF protection while allowing redirects
      httpOnly: true, // Cookie cannot be accessed via JavaScript
      path: '/' // Ensure cookie is sent for all paths
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login attempt:', req.body.username);
    
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      
      if (!user) {
        console.log('Login failed: Invalid credentials');
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      console.log('Login successful for user:', user.username);
      
      req.login(user, (err) => {
        if (err) {
          console.error('Session error during login:', err);
          return next(err);
        }
        
        console.log('Session created, user logged in with ID:', user.id);
        
        // Create a safe version of the user object without sensitive data
        const safeUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          remainingDesigns: user.remainingDesigns
        };
        
        res.status(200).json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log('Logout requested, session ID:', req.sessionID);
    
    if (!req.isAuthenticated()) {
      console.log('Logout requested for unauthenticated session');
      return res.status(200).json({ message: "Not logged in" });
    }
    
    const userId = req.user?.id;
    const username = req.user?.username;
    
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      
      // Regenerate the session ID to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return next(err);
        }
        
        console.log(`User ${username} (ID: ${userId}) logged out successfully`);
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('API User Request - Session ID:', req.sessionID);
    console.log('API User Request - Session:', req.session);
    console.log('API User Request - isAuthenticated:', req.isAuthenticated());
    console.log('API User Request - User:', req.user);
    
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Debug test endpoint
  app.get("/api/test-auth", (req, res) => {
    console.log('Test Auth - Session ID:', req.sessionID);
    console.log('Test Auth - Session:', req.session);
    
    // Create a session manually for testing
    if (!req.session.views) {
      req.session.views = 0;
    }
    req.session.views++;
    
    res.json({
      sessionID: req.sessionID,
      views: req.session.views,
      isAuthenticated: req.isAuthenticated(),
      session: req.session
    });
  });
  
  // Debug test login endpoint
  app.get("/api/test-login", async (req, res) => {
    try {
      // Get test user
      const testUser = await storage.getUserByUsername('testuser');
      
      if (!testUser) {
        return res.status(404).json({ message: "Test user not found" });
      }
      
      // Manually log in the test user
      req.login(testUser, (err) => {
        if (err) {
          console.error('Test login error:', err);
          return res.status(500).json({ message: "Login error", error: err.message });
        }
        
        console.log('Test login successful - Session ID:', req.sessionID);
        console.log('Test login successful - User:', testUser.username);
        
        res.json({
          message: "Test login successful",
          user: {
            id: testUser.id,
            username: testUser.username,
            email: testUser.email
          },
          sessionID: req.sessionID
        });
      });
    } catch (error: any) {
      console.error('Test login exception:', error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
}
