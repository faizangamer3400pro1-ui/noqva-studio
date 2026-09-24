# Noqva AI Studio

Act as a principal product designer and senior full-stack engineer. Build a full-stack, responsive web application called "Noqva AI".

### 1. CORE CONCEPT & OVERVIEW

Noqva AI is an all-in-one AI chat, creative generation, and document studio.

Key Capabilities:

1. Google Authentication (Mandatory sign-in before accessing the dashboard).

2. Persistent Chat History (Saves conversations by user session).

3. Unlimited AI Image Generation (Text-to-Image inside chat or image tool).

4. Image-to-Video Engine (Converts generated/uploaded images into short 5-second video clips).

5. Document Creator (Generates clean, downloadable PDF documents directly from chat outputs).

### 2. DESIGN SYSTEM & VISUAL STYLE (Minimalist Tech Aesthetic)

- Theme: Dark Mode / Minimalist Modern UI (Linear / Stripe style).

- Background: #0D0D0D (Deep Off-Black).

- Cards & Sidebar: #161616 with 1px subtle borders (#262626).

- Primary Accent: #0F766E (Teal) or #6366F1 (Indigo).

- Text: #EEEEEE for primary, #A1A1AA for muted metadata.

- Typography: Clean system sans-serif (Inter / SF Pro). High visual contrast and rounded corners (8px–12px).

### 3. AUTHENTICATION & DATABASE SCHEMA (Supabase / Firebase)

- Google OAuth Integration: Enforce Google Sign-In using Supabase Auth or Firebase Auth. Block main app views if unauthenticated.

Database Tables / Collections:

1. Users (`profiles`):

   - `id`: UUID (Primary Key)

   - `email`: Text

   - `display_name`: Text

   - `created_at`: Timestamp

2. Chat Sessions (`conversations`):

   - `id`: UUID (Primary Key)

   - `user_id`: UUID (Foreign Key -> profiles.id)

   - `title`: Text (Auto-generated from first message)

   - `created_at`: Timestamp

3. Messages (`messages`):

   - `id`: UUID (Primary Key)

   - `conversation_id`: UUID (Foreign Key -> conversations.id)

   - `sender`: Text ("user" | "assistant")

   - `content`: Text (Supports Markdown, image URLs, video URLs, and PDF generation links)

   - `created_at`: Timestamp

---

### 4. USER INTERFACE & NAVIGATION STRUCTURE

Sidebar (Left Panel):

- Top: "Noqva AI" Logo & Branding.

- Action: "New Chat" button (+ icon).

- Chat History List: Displays past saved conversations sorted by date. Clicking a chat loads its full message history.

- Bottom: User profile card (Google avatar, email, Sign Out button).

Main Chat Window (Center):

- Message Stream: Clean chat bubbles supporting Markdown text formatting, rendered images, video players, and download buttons.

- Input Bar (Bottom):

  * Multi-line text field with placeholder: "Ask Noqva AI, generate an image, create a 5s video, or make a PDF document..."

  * Action Buttons: [Attach Image], [Generate Image Mode], [Generate PDF Mode], and [Send Message].

---

### 5. CORE FEATURE IMPLEMENTATION LOGIC

1. Unlimited Free Image Generation:

   - Endpoint: `https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&seed={random_seed}&nologo=true`

   - Trigger: When user asks to generate an image (e.g., "/image a futuristic city"), fetch the image URL and render it in the chat with a "Download Image" button and a "Convert to 5s Video" button.

2. Image-to-Video Engine (5 Seconds Max):

   - Integration: Use Hugging Face Inference API / Replicate API (e.g., Luma Dream Machine, Stable Video Diffusion, or Runway API).

   - Logic: When user clicks "Convert to Video" on any image, send the image URL to the video model endpoint with duration capped at 5 seconds. Display an inline HTML5 `<video>` player in the chat once rendering completes, with a direct download button.

3. PDF Document Generator:

   - Client-side Library: Use `jsPDF` or `pdfmake`.

   - Trigger: When user asks Noqva AI to make a document, report, or PDF (e.g., "Create a PDF resume for..."):

     1. Generate the structured text response.

     2. Render a "Export as PDF" button inside the assistant message block.

     3. Clicking the button converts the formatted text/markdown into a styled PDF file named `Noqva_Document_[timestamp].pdf` and triggers an automatic browser download.

4. Chat Persistence & Memory:

   - Fetch previous message history upon selecting a conversation thread from the sidebar.

   - Automatically save every new user input and assistant output to the database under the active `conversation_id`.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://noqva-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fe158835-5c59-4aa3-b51c-b84d4b4d2e2d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
