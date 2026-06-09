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
