# Healthcare Appointment Scheduling System - Backend

This is the backend service for the Healthcare Appointment Scheduling System, built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or later)
- MongoDB (local installation or MongoDB Atlas account)

## Setup

1. **Install dependencies**

```bash
npm install
```

2. **Environment Configuration**

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/appointment-scheduling
```

For production, use your MongoDB Atlas connection string.

3. **Database Setup**

Ensure MongoDB is running locally or you have configured a MongoDB Atlas connection string in your `.env` file.

To seed the database with initial test data:

```bash
npm run seed
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on http://localhost:5000 and will automatically restart when you make changes to the code.

### Production Mode

```bash
npm run build
npm start
```

## Testing

Run tests with:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## API Endpoints

### Doctors

- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/teudat-zehut/:id` - Get doctor by Israeli ID
- `POST /api/doctors` - Create a new doctor
- `PUT /api/doctors/:id` - Update a doctor
- `DELETE /api/doctors/:id` - Delete a doctor

### Patients

- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by database ID
- `GET /api/patients/teudat-zehut/:id` - Get patient by Israeli ID
- `POST /api/patients` - Create a new patient
- `PUT /api/patients/:id` - Update a patient
- `DELETE /api/patients/:id` - Delete a patient

### Operation History

- `GET /api/ophistory` - Get all operation history
- `GET /api/ophistory/:id` - Get operation by database ID
- `GET /api/ophistory/patient/:patientId` - Get operations by patient ID
- `GET /api/ophistory/patient-teudat-zehut/:patientId` - Get operations by patient Israeli ID
- `GET /api/ophistory/doctor/:doctorId` - Get operations by doctor ID
- `GET /api/ophistory/date/:date` - Get operations by date
- `GET /api/ophistory/location/:location` - Get operations by location
- `GET /api/ophistory/operation-type/:opType` - Get operations by type
- `POST /api/ophistory` - Create a new operation
- `PUT /api/ophistory/:id` - Update an operation
- `DELETE /api/ophistory/:id` - Delete an operation