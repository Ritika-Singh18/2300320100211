# Stage 1

## Notification System API Design

### Problem Understanding

The notification platform is intended to provide students with important updates related to placements, results, and events. Since notifications are user-specific and need to be shown as soon as they are generated, the system should support both REST APIs for fetching notifications and a real-time mechanism for delivering new notifications.

The APIs below are designed from the perspective of a frontend developer who needs to display notifications, mark them as read, and receive new notifications without refreshing the page.

---

## Notification Model

Each notification will contain the following information:

```json
{
  "id": "uuid",
  "studentId": 1042,
  "type": "Placement",
  "message": "Advanced Micro Devices Inc. hiring",
  "isRead": false,
  "createdAt": "2026-04-22T17:49:42Z"
}
```

### Field Description

| Field     | Description                        |
| --------- | ---------------------------------- |
| id        | Unique notification identifier     |
| studentId | Student receiving the notification |
| type      | Placement, Result, or Event        |
| message   | Notification content               |
| isRead    | Read status                        |
| createdAt | Notification creation timestamp    |

---

## API 1: Fetch Notifications

This API is used to display notifications in the notification panel.

### Endpoint

```http
GET /api/notifications
```

### Query Parameters

| Parameter | Description                 |
| --------- | --------------------------- |
| page      | Page number                 |
| limit     | Records per page            |
| type      | Filter by notification type |
| isRead    | Filter by read status       |

### Sample Request

```http
GET /api/notifications?page=1&limit=10&type=Placement
```

### Sample Response

```json
{
  "page": 1,
  "limit": 10,
  "total": 100,
  "notifications": [
    {
      "id": "a87412bd",
      "type": "Placement",
      "message": "Advanced Micro Devices Inc. hiring",
      "isRead": false,
      "createdAt": "2026-04-22T17:49:42Z"
    }
  ]
}
```

---

## API 2: Fetch Notification Details

Used when the frontend wants complete information about a specific notification.

### Endpoint

```http
GET /api/notifications/{notificationId}
```

### Sample Response

```json
{
  "id": "a87412bd",
  "type": "Placement",
  "message": "Advanced Micro Devices Inc. hiring",
  "isRead": false,
  "createdAt": "2026-04-22T17:49:42Z"
}
```

---

## API 3: Mark Notification as Read

When a student opens a notification, its status should change to read.

### Endpoint

```http
PATCH /api/notifications/{notificationId}/read
```

### Sample Response

```json
{
  "message": "Notification marked as read"
}
```

---

## API 4: Mark All Notifications as Read

Allows users to clear all unread notifications at once.

### Endpoint

```http
PATCH /api/notifications/read-all
```

### Sample Response

```json
{
  "message": "All notifications marked as read"
}
```

---

## API 5: Create Notification

This API is used by the notification service whenever a new placement, result, or event notification is generated.

### Endpoint

```http
POST /api/notifications
```

### Request Body

```json
{
  "studentIds": [101, 102, 103],
  "type": "Placement",
  "message": "Advanced Micro Devices Inc. hiring"
}
```

### Response

```json
{
  "message": "Notification created successfully"
}
```

---

## Real-Time Notification Mechanism

To support instant delivery of notifications, I would use WebSockets.

### Flow

1. Student logs into the application.
2. Frontend establishes a WebSocket connection.
3. Notification service creates a notification.
4. Notification is stored in the database.
5. The notification is pushed through the WebSocket connection.
6. Students immediately see the new notification without refreshing the page.

This approach reduces unnecessary API polling and provides a better user experience.

---

## Naming Conventions

* Resource names use plural nouns (`/notifications`).
* HTTP methods are used according to REST standards.
* JSON responses use camelCase naming.
* Notification IDs are generated using UUIDs.

---

## Common Response Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Successful request    |
| 201  | Resource created      |
| 400  | Invalid request       |
| 404  | Resource not found    |
| 500  | Internal server error |




## Design Decisions

### Why REST APIs?

REST APIs are simple to consume from web and mobile applications. They also provide a clear separation between the frontend and backend, making the system easier to maintain and extend.

### Why Pagination?

A student may accumulate hundreds of notifications over time. Returning all notifications in a single response would increase response size and affect performance. Pagination helps reduce response time and bandwidth usage.

### Why Notification Type Filters?

Students may want to view only placement notifications, result announcements, or event updates. Filtering on the server side reduces unnecessary data transfer and improves user experience.

### Why Read/Unread Status?

Read status helps users identify new notifications quickly and prevents important updates from being missed.

---

## High Level Architecture

```text
+----------------+
|   Frontend     |
+----------------+
         |
         | REST API Requests
         v
+----------------+
| Notification   |
|    Service     |
+----------------+
         |
         | Store/Retrieve
         v
+----------------+
|   Database     |
+----------------+

         ^
         |
         | WebSocket Push
         |
+----------------+
| Connected      |
| Students       |
+----------------+
```

### Real-Time Communication

WebSockets are used for real-time delivery of notifications. Once a student opens the application, a persistent connection is established. Whenever a new notification is created, the server pushes it directly to the connected student without requiring page refreshes or repeated polling.


```
```

# Stage 2

## Database Selection

For this notification system, I would choose **PostgreSQL** as the primary database.

### Reasons

1. Notifications have a well-defined structure and relationships.
2. The system requires filtering, pagination, sorting, and read/unread tracking.
3. PostgreSQL provides strong indexing support which is important for fast notification retrieval.
4. ACID compliance ensures reliable storage of notifications.
5. Future reporting and analytics become easier using SQL queries.

Although NoSQL databases can handle large volumes of data, the notification system requirements are highly structured and relational in nature, making PostgreSQL a suitable choice.

---

## Database Schema

### Students Table

```sql
CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    student_id BIGINT NOT NULL,
    notification_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student
    FOREIGN KEY(student_id)
    REFERENCES students(id)
);
```

---

## Relationship

```text
One Student
      |
      |
      v
Many Notifications
```

A student can receive multiple notifications, while each notification belongs to exactly one student.

---

## Recommended Indexes

```sql
CREATE INDEX idx_student_id
ON notifications(student_id);

CREATE INDEX idx_student_read
ON notifications(student_id, is_read);

CREATE INDEX idx_created_at
ON notifications(created_at DESC);

CREATE INDEX idx_notification_type
ON notifications(notification_type);
```

These indexes help speed up filtering and retrieval operations.

---

## Common Queries

### Fetch Latest Notifications

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
ORDER BY created_at DESC
LIMIT 20;
```

---

### Fetch Unread Notifications

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
AND is_read = FALSE
ORDER BY created_at DESC;
```

---

### Fetch Placement Notifications

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
AND notification_type = 'Placement'
ORDER BY created_at DESC;
```

---

### Mark Notification as Read

```sql
UPDATE notifications
SET is_read = TRUE
WHERE id = 'notification-id';
```

---

### Mark All Notifications as Read

```sql
UPDATE notifications
SET is_read = TRUE
WHERE student_id = 1042;
```

---

## Potential Challenges as Data Grows

Assume the platform grows to:

* 50,000 students
* Millions of notifications

The following challenges may occur:

### 1. Slow Query Performance

Searching through millions of rows without indexes will increase response times.

### Solution

Create indexes on frequently queried columns such as:

* student_id
* notification_type
* is_read
* created_at

---

### 2. Large Storage Requirements

Notification records will continuously grow.

### Solution

Archive old notifications periodically into cold storage or archive tables.

---

### 3. Increased Database Load

Large numbers of concurrent users may overload the database.

### Solution

Introduce caching and database read replicas.

---

### 4. Pagination Performance

Offset-based pagination becomes slower for large datasets.

### Solution

Use cursor-based pagination based on created_at and id.

# Stage 3

## Query Performance Analysis

As the platform grows, the most frequently executed query will be fetching notifications for a student.

### Query

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
ORDER BY created_at DESC
LIMIT 20;
```

---

## Why This Query May Become Slow

Initially, the query will perform well because the number of notifications is small.

However, as the platform scales to thousands of students and millions of notifications, the database may need to scan a large number of rows before returning the latest notifications.

Potential issues include:

* Full table scans
* Increased disk I/O
* Higher query execution time
* Slower user experience

The problem becomes more noticeable when many users request notifications simultaneously.

---

## Optimization Strategy

### Create a Composite Index

```sql
CREATE INDEX idx_notifications_student_created
ON notifications(student_id, created_at DESC);
```

### Why This Helps

The query filters using:

```sql
WHERE student_id = ?
```

and sorts using:

```sql
ORDER BY created_at DESC
```

The composite index stores records in the same order required by the query.

As a result:

* Fewer rows need to be scanned.
* Sorting is minimized.
* Query execution becomes significantly faster.

---

## Before Optimization

```text
Database
   |
   | Scan many rows
   v
Find matching student records
   |
   v
Sort records
   |
   v
Return latest 20
```

---

## After Optimization

```text
Database
   |
   | Direct index lookup
   v
Latest notifications found immediately
   |
   v
Return latest 20
```

---

## Additional Improvements

### Pagination

Instead of loading all notifications at once:

```sql
LIMIT 20
```

should always be used.

This reduces memory consumption and response size.

---

### Read Replicas

If notification reads become very frequent, read replicas can be introduced.

Benefits:

* Reduced load on the primary database
* Better scalability
* Improved response times

---

### Caching

Frequently accessed notifications can be cached using Redis.

Benefits:

* Faster retrieval
* Reduced database load
* Better user experience during peak traffic

---

## Conclusion

The notification retrieval query is expected to be the most frequently executed operation in the system. By introducing a composite index on `student_id` and `created_at`, along with pagination, caching, and read replicas, the system can continue to perform efficiently even when handling millions of notifications.


# Stage 4

## Scaling Strategy

The current design works well for a moderate number of students and notifications. However, as the platform grows, additional measures will be required to maintain performance and reliability.

Assume the system scales to:

* 100,000+ students
* Millions of notifications
* Thousands of concurrent users

The following challenges are expected.

---

## Challenge 1: Database Bottleneck

As notification records continue to grow, the database will need to process larger volumes of reads and writes.

### Impact

* Slower query execution
* Increased response times
* Higher database load

### Solution

Introduce database indexing and read replicas.

```text
Application
      |
      |
      +------> Primary Database (Writes)
      |
      +------> Read Replica 1
      |
      +------> Read Replica 2
```

The primary database handles writes, while read replicas handle notification retrieval requests.

---

## Challenge 2: High Read Traffic

Students frequently open the notification panel, resulting in repeated database queries.

### Impact

* Increased load on the database
* Reduced performance during peak usage

### Solution

Use Redis as a caching layer.

```text
Client
   |
   v
Application
   |
   +-----> Redis Cache
   |
   +-----> Database
```

Frequently accessed notifications can be served directly from cache.

Benefits:

* Lower database load
* Faster response times
* Better user experience

---

## Challenge 3: Large Notification Volumes

Over time, notification tables may contain millions of records.

### Impact

* Increased storage requirements
* Slower maintenance operations
* Longer backup times

### Solution

Archive older notifications.

Example:

```text
Notifications older than 1 year
                |
                v
Archive Database / Cold Storage
```

This keeps the active notification table small and efficient.

---

## Challenge 4: Real-Time Delivery at Scale

A large number of simultaneous WebSocket connections can overwhelm a single server.

### Impact

* Connection limits
* Increased memory usage
* Reduced reliability

### Solution

Use multiple WebSocket servers behind a load balancer.

```text
                 Load Balancer
                        |
      ----------------------------------
      |                |               |
      v                v               v
 WebSocket 1     WebSocket 2     WebSocket 3
```

This distributes client connections across multiple servers.

---

## Challenge 5: Notification Processing Delays

Generating notifications synchronously can slow down the application.

### Impact

* Slower API responses
* Reduced throughput

### Solution

Use a message queue.

```text
Notification Creator
         |
         v
    Message Queue
         |
         v
 Notification Worker
         |
         v
     Database
```

Examples:

* RabbitMQ
* Apache Kafka
* AWS SQS

The queue allows notifications to be processed asynchronously.

---

## Proposed Scalable Architecture

```text
                +-------------+
                |  Frontend   |
                +-------------+
                       |
                       v
                +-------------+
                | API Server  |
                +-------------+
                       |
        --------------------------------
        |              |              |
        v              v              v
     Redis         Database      Message Queue
      Cache         Cluster
                                      |
                                      v
                               Notification Worker
                                      |
                                      v
                               WebSocket Service
```

---

## Conclusion

The system can scale effectively by introducing:

1. Database indexing
2. Read replicas
3. Redis caching
4. Message queues
5. Notification archiving
6. Distributed WebSocket servers

These improvements ensure that the platform remains responsive and reliable even when serving a large number of students and notifications.

# Stage 5

## Notification Architecture Redesign

The initial architecture works well for small-scale deployments. However, as the number of students and notifications increases, a more scalable and resilient architecture becomes necessary.

Instead of creating and delivering notifications synchronously, the system can be redesigned using an event-driven architecture.

---

## Current Approach

```text
Admin Action
      |
      v
Notification Service
      |
      v
Database
      |
      v
Student
```

### Limitations

* Tight coupling between components
* Slower response times during high traffic
* Difficult to scale notification delivery
* Single service becomes a bottleneck

---

## Proposed Architecture

```text
                    +------------------+
                    |   Admin Portal   |
                    +------------------+
                             |
                             v
                    +------------------+
                    | Notification API |
                    +------------------+
                             |
                             v
                    +------------------+
                    |  Message Queue   |
                    +------------------+
                             |
               ----------------------------
               |                          |
               v                          v
      +----------------+        +----------------+
      | Notification   |        | Notification   |
      | Worker 1       |        | Worker 2       |
      +----------------+        +----------------+
               |                          |
               ------------ ---------------
                            |
                            v
                   +------------------+
                   |    Database      |
                   +------------------+
                            |
                            v
                   +------------------+
                   | WebSocket Server |
                   +------------------+
                            |
                            v
                   +------------------+
                   |     Students     |
                   +------------------+
```

---

## Event Flow

### Step 1

An administrator creates a new notification.

Example:

```text
AMD hiring applications are now open.
```

---

### Step 2

The Notification API validates the request and publishes an event to the message queue.

Example Event:

```json
{
  "eventType": "NOTIFICATION_CREATED",
  "type": "Placement",
  "message": "AMD hiring applications are now open."
}
```

---

### Step 3

Notification workers consume events from the queue.

Responsibilities:

* Process notification data
* Determine target students
* Store notifications in the database

---

### Step 4

After successful storage, the worker publishes the notification to connected WebSocket servers.

---

### Step 5

Students receive the notification instantly without refreshing the application.

---

## Benefits of the Redesigned Architecture

### 1. Better Scalability

Multiple workers can process notifications simultaneously.

```text
Worker 1
Worker 2
Worker 3
Worker N
```

As demand increases, additional workers can be added without changing application logic.

---

### 2. Improved Reliability

If one worker fails:

```text
Worker 1 -> Failed
Worker 2 -> Continues Processing
```

Notifications remain in the queue until successfully processed.

---

### 3. Faster API Response Time

The API only needs to publish a message to the queue.

It does not wait for:

* Database operations
* Notification delivery
* WebSocket communication

This reduces request latency.

---

### 4. Easier Maintenance

Each component has a single responsibility:

| Component         | Responsibility        |
| ----------------- | --------------------- |
| Notification API  | Accept requests       |
| Queue             | Buffer events         |
| Workers           | Process notifications |
| Database          | Store notifications   |
| WebSocket Service | Deliver notifications |

This makes the system easier to maintain and extend.

---

## Technologies That Can Be Used

### Message Queue

* RabbitMQ
* Apache Kafka
* AWS SQS

### Database

* PostgreSQL

### Cache

* Redis

### Real-Time Communication

* WebSockets
* Socket.IO

---

## Conclusion

The redesigned event-driven architecture improves scalability, reliability, and performance by separating notification creation, processing, storage, and delivery into independent components. This design can efficiently support a growing number of students and notifications while maintaining a responsive user experience.
