# 🧾 InvoiceAI – Smart Invoice Extraction & Analytics

## 📌 Overview

InvoiceAI is an AI-powered application that extracts structured data from invoice documents (JPG, PNG, PDF), stores results in the cloud, and provides analytics for better financial insights.

The system uses AI (Gemini Vision) to convert invoices into structured JSON and visualize spending patterns.

---

## 🚀 Features

### 🔹 Core Features

* 📤 Upload invoices (JPG / PNG / PDF)
* 🧠 AI-powered extraction using Gemini 2.5 Flash Vision
* 🔍 Handles multiple invoice formats and noisy data
* ✅ Structured JSON output with validation
* 💾 Cloud storage for files and extracted data
* 📊 Analytics dashboard

---

### 🔹 Smart Features

* 🧠 Format detection & reuse
* 🔁 Duplicate invoice detection
* 🏷️ Vendor normalization
* 📈 Confidence score
* 🔄 Retry logic
* 📂 Multi-invoice batch processing

---

### 📊 Analytics

* Total spend by vendor
* Monthly spend trends
* Number of invoices processed
* Currency-wise totals

---

## 🏗️ System Architecture

```plaintext
Frontend (Lovable UI)
        ↓
Lovable Cloud Backend (DB + Storage + Edge Functions)
        ↓
AI Processing (Gemini 2.5 Flash Vision)
        ↓
Structured JSON + Analytics
```

---

## 🛠️ Tech Stack

### Frontend

* Lovable UI (React-based)

### Backend

* Lovable Cloud (serverless backend)

### AI

* Gemini 2.5 Flash Vision

### Database & Storage

* Lovable Cloud Database & Storage

---

## ⚙️ How It Works

```plaintext
Upload Invoice → AI Processing → JSON Extraction → Save → Analytics Dashboard
```

---

## 📂 Key Pages

* 🏠 Landing Page – Overview of features
* 🔐 Authentication – Sign up / Sign in
* 📤 Upload Page – Drag & drop with batch processing
* 📊 Dashboard – Summary and invoice list
* 📄 Invoice Details – Line items + raw JSON view
* 📈 Analytics Page – Charts and insights

---

## 🧠 Key Design Decisions

* Used Gemini Vision for direct invoice understanding
* Implemented format detection for better accuracy
* Added confidence scoring for extracted data
* Used cloud-native backend for scalability
* Built modular UI components

---

## ⚠️ Assumptions & Limitations

### Assumptions

* Input invoices are readable
* Important fields like total and vendor exist

### Limitations

* Low-quality images may reduce accuracy
* Complex invoice layouts may affect extraction
* Vendor normalization is basic

---

## 🔮 Future Improvements

* Improved table extraction
* Advanced learning system
* Multi-language support
* Export data to CSV/Excel

---

## 📂 Test Data

Sample invoices used for testing are included.
{
  "currency": "USD",
  "due_date": null,
  "raw_text": "E. Jagan Mohan Reddy",
  "subtotal": null,
  "line_items": [],
  "tax_amount": null,
  "vendor_name": "E. Jagan Mohan Reddy",
  "invoice_date": null,
  "total_amount": null,
  "invoice_number": null,
  "confidence_score": 0.6
}

---

## 🌐 Live Demo

👉 https://insightful-invoices.vercel.app/

---

## 📌 Summary

This project demonstrates:

* AI-powered invoice data extraction
* End-to-end application development
* Cloud-based architecture
* Analytics and insights generation

---
