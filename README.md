# HiveFinder

> A centralized platform to connect students with clubs, organizations, and events on campus — built with **Next.js**.

---

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Anticipated Design Constraints](#anticipated-design-constraints)
- [Conclusion](#conclusion)

---

## Overview
**HiveFinder** is a student engagement platform designed to simplify how students discover, join, and manage campus clubs and organizations. 

Developed for:

**CSC 131: Computer Software Engineering (Fall 2025)**  
Section 4 – 82526

**Team HiveFinders (Group 11):**
- Annyus Chandler - Backend Developer  
- Mark Ciubal - Frontend Developer  
- Angus Husted - Backend Developer / SCRUM Master  
- Saliman Noori - Backend Developer  
- Aaliyah Smallwood - Frontend Developer  

---

## Getting Started

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Installation

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

### Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Functional Requirements

### 1. User Account Management
- Create, Read, Update, Delete (CRUD) user accounts  
- Password recovery  
- Account management (update password, change interests, etc.)  
- Auto-login after registration  

### 2. Browse / Club Listings
- Search and filter clubs by keyword or category  
- Display downloadable list of available clubs  

### 3. Pin Board / Club Page
- Digital bulletin board for announcements and updates  
- CRUD operations for administrators  
- Integration with Google Maps API for meeting locations  
- QR code system for attendance  
- Role-based access (officer vs member)  

### 4. Sign-Up Suggestions
- Suggests clubs based on user interests  
- Offers club creation if none exist  
- Integrates with Buddy Finder  

### 5. Join / Follow / Leave / Unfollow
- Join and follow clubs with confirmation prompts  
- Change button state dynamically (Join → Leave, Follow → Unfollow)  

### 6. Buddy Finder
- Groups similar users via similarity algorithms  
- Enables messaging between verified users  
- Supports custom group creation  

---

## Non-Functional Requirements
| ID | Category | Description |
|----|-----------|-------------|
| NFR1 | Student/Admin Account | Password reset with email verification; login ≤ 30s; unlimited users |
| NFR2 | Club Listing | Accessible 24/7; 99% uptime |
| NFR3 | Pinboard/Dashboard | Live updates ≤ 2s delay; Google Maps integration; QR scan accuracy |
| NFR4 | Club Creation | Real-time creation with duplicate club prevention |
| NFR5 | Pinboard Interaction | Notifications and event alerts with “bell” icon |
| NFR6 | Buddy Finder | Secure authentication to prevent spam/bot users |

---

## Anticipated Design Constraints

### Buddy Finder Moderation  
Managing and moderating social interactions across thousands of users is resource-intensive and may require future automation or reporting tools.

### Google Maps Integration  
Google Maps provides accurate building-level mapping but may not precisely locate rooms or small indoor meeting spaces.

### Relational Database Complexity  
HiveFinder’s data model requires a relational backend to link users, clubs, events, and messages. This increases technical complexity but enables robust filtering, membership, and notifications.

---

## Conclusion

HiveFinder streamlines student engagement by integrating **club discovery**, **event management**, and **community connection** into a single platform.  
It provides students and administrators the tools they need to connect, communicate, and grow their organizations effectively.

The system requirements outlined in this document serve as a guide for the project’s **design, development, and evaluation** phases, ensuring HiveFinder meets the needs of both students and club leaders.

---
