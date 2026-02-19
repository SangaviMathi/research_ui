# Research Assistant — Local Setup

## Folder Structure
```
research-ui/
├── main.py          ← FastAPI backend (your agent)
├── tools.py         ← your existing tools file
├── .env             ← your GOOGLE_API_KEY
├── src/
│   ├── index.js
│   └── App.js       ← React UI
├── public/
│   └── index.html
└── package.json
```

---

## Step 1 — Start the FastAPI Backend

```bash
# Install backend deps (if not already)
pip install fastapi uvicorn

# Copy your tools.py and .env into this folder, then run:
uvicorn main:app --reload
```

Backend will run at: http://localhost:8000

---

## Step 2 — Start the React Frontend

Open a **new terminal**:

```bash
# Install frontend deps
npm install

# Start the UI
npm start
```

Frontend will open at: **http://localhost:3000**

---

## That's it!
- Type your query in the UI
- It calls your LangChain agent at `POST localhost:8000/research`
- Results appear with topic, summary, sources, and tools used
