# Medical Appointment Scheduling System

A full-stack application for scheduling and managing medical appointments, specifically designed for procedures like colonoscopies, sigmoidoscopies, and gastroscopies.

## Project Structure

This is a monorepo containing both frontend and backend code:

```
appointment-scheduling/
├── frontend/         # Next.js frontend application
│   ├── app/          # App Router pages and components
│   └── ...
└── backend/          # Express/Node.js backend API
    ├── src/          # Source code
    │   ├── config/   # Configuration files
    │   ├── models/   # Mongoose data models
    │   ├── routes/   # API routes
    │   └── index.ts  # Entry point
    └── ...
```

## Features

- Patient management (add, view, edit, delete)
- Operation scheduling
- Israeli ID validation
- Phone number validation
- RTL interface in Hebrew
- Health fund selection
- Operation type and preparation tracking

## Tech Stack

### Frontend
- Next.js 13+ with App Router
- React
- TypeScript
- Tailwind CSS
- RTL (Right-to-Left) text direction support

### Backend
- Node.js
- Express
- TypeScript
- MongoDB with Mongoose

## Getting Started

### Prerequisites
- Node.js 16+