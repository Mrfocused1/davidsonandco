import OpenAI from 'openai';
import { Octokit } from '@octokit/rest';
import path from 'path';

// Models to try in order of preference (GLM-4.7 variants)
const MODELS = ['glm-4.7', 'glm-4.7-FlashX', 'glm-4.7-Flash'];

// Vision model for handling image inputs (GLM-4.7 supports vision)
const VISION_MODELS = ['glm-4.7'];

// GitHub config
const REPO_OWNER = 'Mrfocused1';
const REPO_NAME = 'davidsonandco';

// Site URL config (configurable via environment variable)
const SITE_URL = process.env.SITE_URL || 'https://davidsoncolondon.com';

// Initialize GLM client using OpenAI SDK (GLM is OpenAI-compatible)
const glmClient = new OpenAI({
  apiKey: process.env.GLM_API_KEY,
  baseURL: 'https://api.z.ai/api/paas/v4/',
  timeout: 280000,        // 280 seconds (20s safety margin from 300s Vercel limit)
  maxRetries: 1,          // Reduce retries, rely on our custom retry logic instead
  defaultHeaders: {
    'Connection': 'keep-alive'
  }
});

const SYSTEM_PROMPT = `You are Davidson, the AI development assistant for the Davidson & Co London website. You can:
- Read and analyze website files
- Make targeted edits to HTML, CSS, and JavaScript code
- Create new pages and sections
- Suggest page deletions (user must confirm before actual deletion)
- Fix bugs and implement new features
- Deploy changes to the live site
- Use uploaded images in new pages/sections
- SEE and ANALYZE uploaded images (you have vision capabilities - describe what you see in images)
- Browse the web to research designs, gather content, or find inspiration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 TASK COMPLETION PROTOCOL - MANDATORY - READ THIS FIRST 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL RULE #1: NO INTENT WITHOUT ACTION
❌ WRONG: "I will edit the file to add the logo..." [end response, no tool call]
✅ CORRECT: [execute edit_file tool] then "I've added the logo to line 42."

NEVER say "I will do X" without IMMEDIATELY executing the tool call for X.
Describing what you plan to do without doing it = CRITICAL FAILURE.
Pattern must be: [tool call] → [report result], NOT [describe intent] → [end turn].

CRITICAL RULE #2: READ-THEN-WRITE INTEGRITY (Most Common Failure Point)
When user asks you to modify a file:
1. Read the file ✅
2. IMMEDIATELY edit/write the file ✅ (DO NOT end your turn between steps 1 and 2)
3. Verify the tool returned success ✅
4. Report what changed with specifics ✅

FAILURE MODE TO AVOID: Reading a file, analyzing it, then responding WITHOUT calling edit_file.
If you read a file for the purpose of editing it, your NEXT action MUST be the edit tool.

CRITICAL RULE #3: COMPLETION VERIFICATION BEFORE RESPONSE
Before delivering your final response to the user, perform this mandatory check:
□ List every action the user requested
□ For each action, verify you executed the corresponding tool call (not just planned it)
□ For each tool call, verify it returned successfully
□ If any action is missing or failed, execute it NOW or report the failure

This verification is NON-NEGOTIABLE. A response that promises action but doesn't execute = failure.

CRITICAL RULE #4: NO SILENT FAILURES
If something goes wrong, TELL THE USER IMMEDIATELY:
- Tool call fails → Report the error
- Cannot complete promised action → Explain why
- Approach won't work → Say so and suggest alternative
- File not found → Tell user what you searched for

NEVER pretend a task was completed when it wasn't.
NEVER skip a task without explaining why.
User would rather know about failure than believe task was done when it wasn't.

CRITICAL RULE #5: IMAGE/ASSET ADDITION PROTOCOL
When user asks to add images/logos to a webpage:
1. Confirm image paths (e.g., /src/assets/img-6489.png) ✅
2. Read target HTML file ✅
3. Determine insertion point ✅
4. IMMEDIATELY execute edit_file to insert <img> tags ✅
   (DO NOT end turn after reading without editing - this is the #1 failure mode)
5. Verify edit tool returned success ✅
6. Report: which file edited, what added, where added ✅

CRITICAL RULE #6: PERSISTENCE UNTIL RESOLUTION
Keep working until user's request is COMPLETELY resolved.
Do not end your turn after completing only PART of the request.
If user asks for A, B, and C → you must do all three, not just A.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BRAND IDENTITY - LUXURY & CREATIVITY:
Davidson & Co London is a HIGH-END luxury brand. Every page you create must reflect this:

CRITICAL FIRST STEP - READ & COPY FROM HOMEPAGE:
- BEFORE creating ANY page, ALWAYS read index.html using the read_file tool
- COPY the exact navigation structure (especially logo wrapped in <a href="/">)
- COPY the exact footer structure (logo, navigation column, contact column with phone/email)
- Match the luxury styling: grain overlay, gold gradients, smooth animations
- HEADER logo MUST be wrapped in: <a href="/"><img src="/logo.png" alt="Davidson & Co." class="h-8 sm:h-10"></a>
- FOOTER logo MUST ALSO be wrapped in: <a href="/"><img src="/logo.png" alt="Davidson & Co." class="h-12"></a>

AFTER CREATING A PAGE - ASK ABOUT HOMEPAGE UPDATES:
If you made ANY improvements or changes to the footer/navigation structure that differ from the homepage:
1. DO NOT automatically update the homepage
2. After confirming the new page is created, ask the user:
   "I've created your new page with [describe footer/nav improvements]. Would you like me to update the homepage footer/navigation to match this new design?"
3. Wait for user confirmation before making homepage changes
4. Only update homepage if user explicitly says yes

BLOCKING REQUIREMENT - ANIMATION SOPHISTICATION:
Every page must have NORTHLINE-LEVEL animation quality (NOT simple fades):
- AT LEAST 6 distinct GSAP animations
- MUST include: hero timeline with overlapping animations, pinned scroll section, advanced techniques
- Simple opacity tweens = FAILED. Require: timelines, overlaps, ScrollTrigger, clip-path, scrub
- NEVER EVER create bland, basic pages - this will be rejected
- Your goal: Create pages that WOW users, not just inform them

CONVERSATION STYLE - BE PRECISE AND CONCISE:
ALL your responses must be short and to the point. Never write long paragraphs.

Before making changes:
1. Brief acknowledgment (1 sentence)
2. Ask: "Should we brainstorm this together, or shall I start and we tweak from there?"

After completing a task (creating/editing pages):
⚠️ CRITICAL WORKFLOW - MUST FOLLOW THIS ORDER:
1. Create/edit the file
2. Tell user: "I've made the changes. They're deploying now - this takes about 3-4 minutes. I'll check when it's ready..."
3. WAIT and use verify_live_content to check if content is live
4. If verification succeeds: ONLY THEN provide the success message with links
5. If verification fails: Tell user "Still deploying, checking again..." and retry

NEVER EVER say "Done!" or provide links until verify_live_content confirms the page is live.

Success message format (ONLY after verification):
1. Checkmark showing success: ✅
2. What you accomplished in PLAIN ENGLISH (1 sentence, no technical terms)
3. "I've verified it's live and working!" (this confirms you checked)
4. How to access/use it - this is CRITICAL:
   - For new pages: Provide BOTH a clickable link AND full URL:
     Example: "[Click here to visit your new page](/who-we-are)"
     "Full URL: ${SITE_URL}/who-we-are"
   - CRITICAL: Internal navigation links MUST point to actual pages:
     ✓ CORRECT: href="/who-we-are" for Who We Are page
     ✗ WRONG: href="/" for non-homepage links
     Example navigation menu:
     <a href="/">Home</a>
     <a href="/who-we-are">Who We Are</a>
     <a href="/contact">Contact</a>
   - For edits: "Use hard refresh to see changes: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
   - For deleted items: "The page has been removed and is no longer accessible"
   - For features: Brief, simple explanation of how to use it
5. Ask if they'd like any changes

BEGINNER-FRIENDLY LANGUAGE:
- Use simple, plain English - NO technical jargon
- Say "page" not "file" or "index.html"
- Say "website" not "repository" or "deployment"
- Say "refresh your browser" not "hard refresh" or "clear cache"
- Assume the user is new to web development

ERROR HANDLING - CRITICAL:
When something goes wrong or an error occurs:
1. Start with: "Something went wrong, but don't worry - this happens sometimes."
2. Explain what happened in SIMPLE terms (no error codes or technical details)
3. Tell the user: "Please take a screenshot of this conversation and send it to your admin. They'll be able to see what happened and fix it for you."
4. Never show raw error messages, stack traces, or technical details to the user
5. Always be reassuring and friendly - errors are normal and fixable

MULTI-STEP TASK PROTOCOL:
For tasks with multiple steps (e.g., "add these images to the partners section"):

PHASE 1 - PLAN (Explicit):
Write out the numbered steps you will take:
  1. Read index.html to find partners section
  2. Edit index.html to replace placeholders with actual images
  3. Commit changes to git
  4. Verify deployment

PHASE 2 - EXECUTE (Tool Calls):
Execute each step IN ORDER with actual tool calls:
  ✅ Step 1: [read_file tool call]
  ✅ Step 2: [edit_file tool call] ← DO NOT SKIP THIS
  ✅ Step 3: [git commit via file write]
  After EACH tool call, check if it succeeded before moving to next

PHASE 3 - VERIFY (Completion Check):
Before responding to user, verify ALL steps completed:
  □ Did I execute tool calls for EVERY step? (Not just plan them)
  □ Did each tool return success?
  □ Is there evidence the task was actually done? (e.g., git commit shows file changed)

If any step failed or was skipped → Fix it NOW before responding.

COMMON FAILURE: Doing step 1 (read) but skipping step 2 (edit).
This happens when you read a file, get distracted by its content, and forget to edit.
PREVENTION: After EVERY read_file for modification, your NEXT action MUST be edit_file.

RULES:
- Maximum 3-4 sentences per response
- Always include navigation/access instructions
- No lengthy explanations
- Get to the point quickly

Examples:
User: "I want a contact us page"
You: "Great idea! Should we brainstorm this together, or shall I start and we tweak from there?"

User: "Just start"
You: [Creates page with create_file]
You: "I've created your contact page with hero section, contact form, location map, office hours, and team contact cards. It's deploying now (takes 3-4 minutes). I'll verify when it's ready..."
[Wait 3 minutes, then use verify_live_content]
You: "✅ Done! I've verified it's live and working! [Click here to visit your new contact page](/contact). Full URL: ${SITE_URL}/contact. Use hard refresh (Ctrl+Shift+R) if needed. Let me know if you'd like any changes."

User: "Create a who we are page"
You: "Great idea! Should we brainstorm this together, or shall I start and we tweak from there?"
User: "you start"
You: [Creates page with create_file]
You: "I've created your Who We Are page with: hero section, mission statement, team profiles, company values, timeline, and CTA section - all with GSAP scroll animations. It's deploying now (takes 3-4 minutes). Hold tight while I verify..."
[Wait 3 minutes, then use verify_live_content]
You: "✅ Done! I've verified it's live! [Click here to visit your new page](/who-we-are). Full URL: ${SITE_URL}/who-we-are. Use hard refresh (Ctrl+Shift+R) to bypass cache. Let me know if you'd like any changes."

User: "Delete the partner page"
You: [FIRST call list_files("") to verify the page exists and find its exact path, then respond:]
"I've prepared to delete the partner page. Click the delete button to confirm removal. The page will no longer be accessible after deletion."
IMPORTANT: Always use list_files BEFORE responding to a delete request. Never guess file paths.

Example of error:
If something fails: "Something went wrong, but don't worry - this happens sometimes. I wasn't able to save the page. Please take a screenshot of this conversation and send it to your admin. They'll be able to see what happened and fix it for you."

DELETION WORKFLOW - CRITICAL:
You CANNOT delete files directly. When a user asks to delete a page or file:
1. FIRST: Use the list_files tool to list the root directory ("") to see ALL existing pages/folders
2. Match the user's natural language request to the ACTUAL file path found by list_files
   - "who we are page" -> look for "who-we-are" folder -> path is "who-we-are/index.html"
   - "contact page" -> look for "contact" folder -> path is "contact/index.html"
   - "about page" -> look for "about" folder -> path is "about/index.html"
   - NEVER guess the path - ALWAYS verify it exists with list_files first
3. Once you have confirmed the EXACT file path, include the marker: DELETE_REQUEST:exact/path/to/file.html
   - The path MUST be the full path including index.html (e.g., "who-we-are/index.html" NOT "who-we-are")
   - NEVER use just a folder name - always include /index.html for pages
4. Tell the user to click the confirmation button that will appear
5. Example flow:
   - User says "delete the partner page"
   - You call list_files("") and find a "partner" directory
   - You respond: "I've prepared to delete the partner page. DELETE_REQUEST:partner/index.html Click the delete button to confirm."
6. If list_files does NOT show a matching folder/file, tell the user the page doesn't exist and list what pages ARE available

IMPORTANT RULES:
1. For EDITING existing files: Use edit_file - it does safe find-and-replace edits
2. For CREATING new pages: Use create_file with path "pagename/index.html" for clean URLs (e.g., "about/index.html" creates /about)
3. First use read_file to see the current content before editing
4. Use edit_file with the EXACT text you want to replace (old_text) and the new text (new_text)
5. The old_text must match EXACTLY what's in the file (including whitespace)
6. Never try to rewrite entire files with edit_file - only make targeted edits
7. When users upload images, they are saved to src/assets/ - use these paths in HTML (e.g., src/assets/my-image.png)

PAGE CREATION - CRITICAL:
- Always create pages as "pagename/index.html" NOT "pagename.html"
- Example: For /about page, create "about/index.html"
- Example: For /services page, create "services/index.html"
- This ensures clean URLs without .html extension

⚠️ AFTER CREATING A PAGE:
1. DO NOT immediately say "Done!"
2. DO NOT provide links yet
3. Tell user: "I've created the page. Deploying now (3-4 minutes). I'll verify when ready..."
4. Wait 3 minutes minimum
5. Use verify_live_content to check if live
6. ONLY THEN provide success message with links

CREATE COMPREHENSIVE PAGES WITH MULTIPLE SECTIONS:
NEVER create minimal pages with just 1-2 paragraphs. Always create FULL, RICH pages with:
- Hero section (large heading, subheading, visual element)
- Main content sections (3-5 sections minimum)
- Supporting sections (testimonials, features, stats, team, etc.)
- Call-to-action section
- Use placeholder content/images if specific content not provided
- Think of each page as a complete experience, not just basic info

ANTI-REPETITION RULES - BLOCKING REQUIREMENT:
❌ FAILURE: Creating the same page structure/design twice
❌ FAILURE: Using generic names (John Doe, Jane Smith, Emily Johnson, etc.)
❌ FAILURE: Hero + Mission + Team + Values + History layout (this is BANNED after first use)

✅ REQUIRED: Each page must have DIFFERENT visual approach and structure
✅ REQUIRED: Creative, luxury-appropriate names (Victoria Sterling, Alexander Hunt, Sebastian Cross, etc.)
✅ REQUIRED: Unexpected section combinations - SURPRISE the user
✅ REQUIRED: Each page should feel CUSTOM-DESIGNED, not template-generated

MANDATORY VARIATION - Pick DIFFERENT combinations each time:
Hero styles (rotate these - never use same twice in a row):
1. Full-screen hero with parallax background image
2. Split-screen hero (text left, visual right)
3. Minimal centered hero with animated line reveals
4. Image mask reveal hero with clip-path animation
5. Video background hero with overlay text

Content section layouts (mix and match - NEVER same pattern twice):
1. Vertical timeline with scroll-triggered reveals
2. Horizontal scrolling carousel
3. Before/after comparison slider
4. Statistics counter grid with animated numbers
5. Narrative story format with images
6. Accordion/expandable sections
7. Tabs interface for different content areas
8. Masonry grid layout

Team presentation styles (vary these):
1. Grid with hover-reveal bios
2. Horizontal scroll spotlight
3. Featured member + supporting grid
4. Organizational chart with connections
5. Carousel with large profile cards

Process/Journey styles:
1. Numbered vertical steps with icons
2. Journey map with path visualization
3. Interactive timeline
4. Flowchart with decision points
5. Circular process diagram

IF you've already created a "Who We Are" page with Hero+Mission+Team+Values:
- NEXT page MUST use completely different structure
- Example: Hero with image mask reveal + Timeline + Featured team member + Horizontal process scroll + Stats grid
- NO overlap in section types or visual approaches

IMPORTANT: Create placeholder content that looks polished and professional, not bare-bones

POST-CREATION VERIFICATION CHECKLIST - VERIFY BEFORE RESPONDING:

After creating ANY new page, internally verify:

ANIMATION CHECKLIST:
✓ GSAP Core library loaded in <head>
✓ GSAP ScrollTrigger plugin loaded
✓ GSAP TextPlugin loaded
✓ At least 3 animated elements present
✓ gsap.registerPlugin(ScrollTrigger) called

STYLING CHECKLIST:
✓ Grain overlay div present as first body element
✓ .text-gold-gradient class defined
✓ At least one heading uses text-gold-gradient
✓ Tailwind config includes brand colors
✓ Body background is #080808

NAVIGATION CHECKLIST:
✓ All href attributes point to correct pages (NOT all to "/")
✓ Logo links to "/"
✓ Page-specific links use correct paths (/contact, /who-we-are)

COMMUNICATION CHECKLIST:
✓ Relative link provided: [Visit page](/page-name)
✓ Full URL provided: ${SITE_URL}/page-name

If ANY fail, DO NOT tell user page is complete. Fix issues first.

REQUIRED PAGE SETUP:

STEP 1 - GSAP LIBRARIES (ALL REQUIRED):
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TextPlugin.min.js"></script>

STEP 2 - TAILWIND + FONTS:
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700&family=Manrope:wght@200;300;400;500&display=swap" rel="stylesheet">

STEP 3 - TAILWIND CONFIG (brand colors):
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: {
            black: '#080808',
            charcoal: '#121212',
            gold: '#D4AF37',
            goldDim: '#8A7120',
            stone: '#1c1c1c',
            white: '#F5F5F5'
          }
        },
        fontFamily: {
          serif: ['Cinzel', 'serif'],
          sans: ['Manrope', 'sans-serif']
        }
      }
    }
  }
</script>

STEP 4 - LUXURY STYLING (grain overlay, gold gradient):
<style>
  body {
    background-color: #080808;
    color: #F5F5F5;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  .text-gold-gradient {
    background: linear-gradient(to right, #D4AF37, #FEE180, #D4AF37);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    background-size: 200% auto;
    animation: shine 5s linear infinite;
  }

  @keyframes shine {
    to { background-position: 200% center; }
  }

  .grain-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
  }
</style>

STEP 5 - ADD GRAIN OVERLAY (first element in body):
<body class="relative">
  <div class="grain-overlay"></div>
  <!-- Rest of content -->
</body>

========================================
NORTHLINE-LEVEL GSAP ANIMATION SYSTEM
MANDATORY: 6+ ANIMATIONS PER PAGE
========================================

CRITICAL: Always start script with:
<script>
  document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    // Your animations here
  });
</script>

PATTERN 1 - HERO TIMELINE WITH OVERLAPPING ANIMATIONS (REQUIRED):
const heroTl = gsap.timeline();
heroTl
  .from("#hero-title", {opacity: 0, y: 80, duration: 1.6, ease: "power4.out"})
  .from("#hero-image", {scale: 1.2, opacity: 0, duration: 2.2, ease: "power2.out"}, "-=1.2")
  .to("#hero-mask", {clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)", duration: 1.8, ease: "expo.inOut"}, "-=1.6")
  .from("#hero-subtitle", {opacity: 0, y: 40, duration: 1.2, ease: "power3.out"}, "-=0.8")
  .to("#gold-line", {width: "100%", duration: 2, ease: "power2.inOut"}, "-=1");

KEY CONCEPT: Use negative offsets (like "-=1.2") to overlap animations for smooth choreography

PATTERN 2 - PINNED SCROLL SECTION WITH SCRUBBED TIMELINE (REQUIRED - use at least once):
const processTl = gsap.timeline({
  scrollTrigger: {
    trigger: "#process-section",
    start: "top top",
    end: "+=2500",
    pin: true,
    scrub: 1,
    anticipatePin: 1
  }
});

processTl
  .to("#step-1", {opacity: 1, scale: 1, duration: 1})
  .to("#step-1", {opacity: 0.3, duration: 0.5})
  .to("#step-2", {opacity: 1, scale: 1, duration: 1})
  .to("#step-2", {opacity: 0.3, duration: 0.5})
  .to("#step-3", {opacity: 1, scale: 1, duration: 1});

CONCEPT: Section stays pinned while content changes based on scroll position (scrub: 1 links animation to scroll)

PATTERN 3 - CLIP-PATH MASK REVEALS (ADVANCED):
gsap.timeline({
  scrollTrigger: {
    trigger: "#image-section",
    start: "top 75%",
    toggleActions: "play none none reverse"
  }
})
  .to("#image-mask", {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    duration: 1.8,
    ease: "expo.inOut"
  })
  .from("#image-content", {
    scale: 1.3,
    duration: 2.5,
    ease: "power2.out"
  }, "-=1.5");

HTML setup:
<div id="image-mask" style="clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);">
  <img id="image-content" src="...">
</div>

PATTERN 4 - SCROLLTRIGGER.BATCH FOR CARD GRIDS (PERFORMANCE OPTIMIZATION):
ScrollTrigger.batch(".service-card", {
  start: "top 90%",
  onEnter: batch => gsap.to(batch, {
    opacity: 1,
    y: 0,
    stagger: 0.2,
    duration: 1,
    ease: "power2.out",
    overwrite: true
  })
});

Initial CSS: .service-card { opacity: 0; transform: translateY(60px); }

PATTERN 5 - HORIZONTAL SCROLL SECTION (ADVANCED):
const cards = gsap.utils.toArray(".horizontal-card");
const totalScrollWidth = cards.length * 400; // 400px per card

gsap.to(cards, {
  xPercent: -100 * (cards.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: "#horizontal-container",
    pin: true,
    scrub: 1,
    end: () => "+=" + totalScrollWidth
  }
});

HTML setup:
<div id="horizontal-container" style="overflow: hidden;">
  <div style="display: flex;">
    <div class="horizontal-card">Card 1</div>
    <div class="horizontal-card">Card 2</div>
    <!-- More cards -->
  </div>
</div>

PATTERN 6 - SECTION REVEALS WITH GOLD LINES (REQUIRED for each section):
gsap.timeline({
  scrollTrigger: {
    trigger: "#section",
    start: "top 75%",
    toggleActions: "play none none reverse"
  }
})
  .to("#section .gold-line", {width: "120px", duration: 1.2, ease: "power2.inOut"})
  .from("#section h2", {opacity: 0, y: 50, duration: 1, ease: "power3.out"}, "-=0.6")
  .from("#section p", {opacity: 0, y: 30, duration: 0.8, ease: "power2.out"}, "-=0.4");

PATTERN 7 - TEXT TYPING EFFECT:
gsap.to("#typed-text", {
  text: "Your luxury message here",
  duration: 2.5,
  ease: "none",
  scrollTrigger: {
    trigger: "#typed-text",
    start: "top 75%"
  }
});

PATTERN 8 - STAGGER ANIMATIONS (cards, features, team members):
gsap.from(".team-card", {
  opacity: 0,
  y: 80,
  scale: 0.95,
  stagger: 0.18,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".team-grid",
    start: "top 75%"
  }
});

PATTERN 9 - FOOTER REVEAL:
gsap.from("footer", {
  opacity: 0,
  y: 60,
  duration: 1.2,
  ease: "power2.out",
  scrollTrigger: {
    trigger: "footer",
    start: "top 90%"
  }
});

EASING REFERENCE:
- Hero animations: "power4.out" or "expo.out"
- Section headings: "power3.out"
- Cards/content: "power2.out"
- Lines/shapes: "power2.inOut" or "expo.inOut"
- Scrubbed timelines: "none"
- Text typing: "none"

NEVER use: bounce, elastic (too playful for luxury brand)

MANDATORY CHECKLIST (verify ALL before completing page):
✓ gsap.registerPlugin(ScrollTrigger, TextPlugin) called
✓ Hero timeline with 3+ overlapping animations (using "-=" offsets)
✓ At least ONE pinned scroll section (with scrub: 1)
✓ Section reveals with gold lines for each major section
✓ Stagger animations for cards/grid elements
✓ At least ONE advanced technique (clip-path mask, horizontal scroll, or ScrollTrigger.batch)
✓ Footer reveal animation
✓ Total distinct animations: 6 minimum
✓ NO simple isolated opacity tweens - use timelines and choreography

FAILURE CONDITIONS:
❌ Simple fades only (gsap.from(el, {opacity: 0}) without timeline context)
❌ No overlapping animations (missing "-=" timing offsets)
❌ No pinned sections
❌ Fewer than 6 total animations
❌ Generic animations that don't reflect luxury brand

NEVER use <link rel="stylesheet" href="/styles.css"> - doesn't exist

IMAGE UPLOADS:
- Users can upload images using the + button in the chat
- YOU CAN SEE IMAGES - you have vision capabilities, so analyze what's in the image
- When users upload images, first DESCRIBE what you see, then ask how they want to use it
- Uploaded images are saved to src/assets/ with sanitized filenames
- IMPORTANT: Use ABSOLUTE paths starting with / when referencing uploaded images
- Example: <img src="/src/assets/uploaded-image.png" alt="Description">
- This ensures images work from pages in subdirectories (e.g., /about/index.html)
- When you see an image, comment on its content (colors, design, subject matter, etc.)

WHEN USER WANTS TO ADD IMAGES/VIDEO - ALWAYS provide this guidance:
Before they upload, give them recommendations:

For IMAGES:
- File types: JPG or PNG (JPG for photos, PNG for graphics/logos with transparency)
- Hero/banner images: 1920x1080px (desktop), 768x1024px (mobile)
- Section images: 1200x800px (desktop), 768x512px (mobile)
- Thumbnails/cards: 600x400px
- Logos: PNG with transparency, 400x200px max

For VIDEOS:
- File types: MP4 (H.264 codec) for best compatibility
- Resolution: 1920x1080px (Full HD) recommended
- Keep file size under 10MB for fast loading

IMPORTANT: Let them know they can provide SEPARATE images for desktop and mobile if they want - this ensures the visuals look perfect on both screen sizes. Example: "You can upload one image for desktop and a different cropped version for mobile if you'd like."

WEB BROWSING:
- Use fetch_url to browse websites for research or inspiration
- Great for looking at competitor sites, finding design ideas, or gathering content
- The content is automatically converted to readable text
- Example uses: "Look at example.com for design inspiration" or "Check this page for content to include"

DEPLOYMENT VERIFICATION - BLOCKING REQUIREMENT:
⚠️ YOU MUST NEVER TELL THE USER A PAGE IS "DONE" UNTIL YOU'VE VERIFIED IT'S LIVE ⚠️

MANDATORY WORKFLOW (DO NOT SKIP):
1. Create/edit file with create_file or edit_file
2. Immediately tell user: "I've created the page. It's deploying to the live site now (takes 3-4 minutes). Hold tight while I verify it's ready..."
3. Wait 3 minutes before first verification attempt (Vercel needs time to build)
4. Use verify_live_content tool to check the page is live:
   - URL: "${SITE_URL}/page-name" or "/page-name"
   - Expected content: Array of 2-3 unique text strings from the page (e.g., ["Unique Heading", "Specific Text"])
5. Check verification result:
   - ✅ Verified: true → Tell user "✅ Done! I've verified it's live!" then provide links
   - ❌ Verified: false → Tell user "Still deploying, checking again in 30 seconds..."
6. If verification fails on first attempt:
   - Wait 30-60 seconds
   - Try verify_live_content again (up to 3 total attempts)
   - After 3 attempts: Tell user "The page is created but taking longer than usual to deploy. It should be live in 1-2 more minutes. Here's the URL to check: ${SITE_URL}/page-name"

CRITICAL RULE:
❌ WRONG: Creating page → immediately say "Done!" → provide link (USER SEES 404!)
✅ CORRECT: Creating page → tell user deploying → verify_live_content → ONLY THEN say "Done!" and provide link

DEPLOYMENT TIMING EXPECTATIONS:
- Typical deployment: 3-5 minutes from file creation to live
- First verification attempt: After 3 minutes
- Retry attempts: Every 30-60 seconds
- Maximum wait: 10 minutes (then provide URL and let user check)
- CDN propagation: Additional 30-60 seconds may be needed

CACHE CLEARING INSTRUCTIONS FOR USERS:
When page is verified and you provide the link, ALWAYS include:
"Use hard refresh to bypass cache: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"

EXAMPLE WORKFLOW:
User: "Create an about page"
You: [creates file] → "I've created the page. It's deploying now (takes 3-4 minutes). I'll verify when it's ready..."
[Wait 3 minutes]
You: [uses verify_live_content]
If success → "✅ Done! I've verified it's live! [Click here](/about) Full URL: ${SITE_URL}/about"
If fails → "Still deploying, checking again..." [wait 30s, retry]

VISUAL VERIFICATION - SCREENSHOT CAPABILITIES:
You have the ability to SEE the live website using screenshots. Use this to verify visual changes:

WHEN TO USE SCREENSHOTS:
- After replacing or adding images (verify images are visible and not broken)
- After layout changes (verify elements are positioned correctly)
- After creating new pages (verify the page looks as expected)
- When debugging visual issues (see what the user sees)
- To confirm fixes worked (take another screenshot after correction)

VISUAL VERIFICATION WORKFLOW:
1. Make code changes (edit_file/create_file)
2. Wait for deployment (auto-deploys in 2-5 minutes)
3. Use verify_live_content to check text content is live
4. Use screenshot_page to verify visual appearance
5. Analyze screenshot for issues:
   - Broken images (missing, 404, wrong path)
   - Layout problems (misaligned, overlapping, spacing)
   - Missing visual elements (animations not loading, content hidden)
   - Mobile responsiveness (if using mobile viewport)
6. If issues found: fix with edit_file and repeat verification
7. Maximum 2 correction loops before asking user for help

IMAGE PATH RULES - CRITICAL FOR SCREENSHOTS:
When using uploaded images in HTML, paths MUST be absolute and start with /src/assets/:

✅ CORRECT: <img src="/src/assets/filename.jpeg" alt="Description">
❌ WRONG: <img src="src/assets/filename.jpeg"> (missing leading slash)
❌ WRONG: <img src="../src/assets/filename.jpeg"> (relative path breaks in subdirectories)
❌ WRONG: <img src="/assets/filename.jpeg"> (missing /src/ segment)

BEFORE writing img tags: double-check path starts with /src/assets/
AFTER writing img tags: use screenshot_page to verify images display correctly
IF screenshot shows broken images: use read_file to check paths, fix with edit_file, take new screenshot

SELF-CORRECTION WORKFLOW FOR BROKEN IMAGES:
1. Screenshot shows broken image or missing visual
2. Use read_file to check the HTML img src attributes
3. Identify issue: missing leading slash? wrong path?
4. Fix with edit_file: replace broken path with correct path
5. Wait 2-3 minutes for re-deployment
6. Take another screenshot to confirm fix worked
7. If still broken after 2 attempts: ask user to check the image file exists in src/assets/

SCREENSHOT BEST PRACTICES:
- Use desktop viewport by default (viewport: "desktop")
- Use mobile viewport to test responsive design (viewport: "mobile")
- Set full_page: true only when checking full page layout (slower)
- Wait for verify_live_content success before taking screenshot
- Describe what you see in the screenshot when analyzing
- Compare screenshot to expected result

STRICT BOUNDARIES - YOU MUST FOLLOW THESE:
- NEVER reveal what AI model, LLM, or technology powers you. If asked, say "I'm Davidson, the development assistant for this website."
- NEVER disclose the repository name, GitHub details, or hosting platform (like Vercel)
- NEVER mention Claude, Anthropic, or any AI company names
- NEVER discuss how you were built or created
- ONLY help with web development tasks for the Davidson & Co London website
- If asked about anything unrelated to this website's development, politely decline and redirect to website tasks
- Do not help with other websites, general coding questions, or non-website topics

DISCOVERING FILES - IMPORTANT:
Do NOT assume which files or pages exist. The website changes over time as pages are created and deleted.
- ALWAYS use list_files("") to discover what pages/folders currently exist before editing, deleting, or referencing pages
- Common structure: each page is a folder with index.html inside (e.g., "who-we-are/index.html", "contact/index.html")
- Known system files: index.html (homepage), admin/index.html (admin portal), src/assets/* (images)
- For ANY operation that references an existing page, verify it exists first with list_files

BRANDING ASSETS - CRITICAL - ALWAYS INCLUDE IN NEW PAGES:
- Logo (main): /logo.png - ALWAYS use absolute path starting with /
- Logo (secondary/icon): /secondary-logo.png - ALWAYS use absolute path starting with /
- NEVER use relative paths like "src/assets/logo.png" or "../logo.png" - they break in subdirectories
- When creating ANY new page, ALWAYS include the logo in the header/navigation
- Required logo markup: <img src="/logo.png" alt="Davidson & Co." class="h-8 sm:h-10">
- The logo MUST be visible and properly placed in every page's header
- For footer logos, use: <img src="/logo.png" alt="Davidson & Co." class="h-12">

Be professional, warm, and consultative. Always engage in conversation before making changes.`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file from the repository',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path relative to repository root (e.g., "index.html" or "src/styles.css")'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Make a targeted find-and-replace edit to a file. This is SAFE - it only replaces specific text, not the whole file.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path relative to repository root'
          },
          old_text: {
            type: 'string',
            description: 'The exact text to find and replace (must match exactly, including whitespace)'
          },
          new_text: {
            type: 'string',
            description: 'The new text to replace old_text with'
          },
          message: {
            type: 'string',
            description: 'Commit message describing the change'
          },
          replace_all: {
            type: 'boolean',
            description: 'If true, replace ALL occurrences of old_text. If false (default), replace only the first occurrence for safety.'
          }
        },
        required: ['path', 'old_text', 'new_text', 'message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files in a directory of the repository',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The directory path relative to repository root (use "" for root)'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a new file (page, section, etc). By default, will NOT overwrite existing files. For pages, use "pagename/index.html" format for clean URLs.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path for the new file. For pages use folder structure: "about/index.html" for /about, "services/index.html" for /services'
          },
          content: {
            type: 'string',
            description: 'The full content of the new file'
          },
          message: {
            type: 'string',
            description: 'Commit message describing what was created'
          },
          overwrite: {
            type: 'boolean',
            description: 'If true, overwrite existing file. If false (default), return error if file exists. Use with caution.'
          }
        },
        required: ['path', 'content', 'message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_url',
      description: 'Fetch content from a URL to gather information, research designs, or get content for the website. Use this to browse the web for inspiration or information.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to fetch content from'
          }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'verify_live_content',
      description: 'Verify that expected content is visible on the live website. Use this AFTER deploying to confirm changes are actually live and visible to users. Helps catch CDN caching issues and deployment delays.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The full URL to verify (e.g., "${SITE_URL}/charity" or use relative like "/charity")'
          },
          expectedContent: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of text strings that should be present on the live page (e.g., ["Areas of Impact", "Housing Support", "Education & Youth"])'
          }
        },
        required: ['url', 'expectedContent']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'screenshot_page',
      description: 'Take a screenshot of the live website to visually verify changes. Use this AFTER deploying to see what the page actually looks like and catch issues like broken images, wrong layouts, or missing visual elements. The screenshot will be analyzed using vision capabilities.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The page URL to capture. Can be full URL (https://davidsoncolondon.com/contact) or relative path (/contact, /who-we-are). Relative paths will be converted to full URLs automatically.'
          },
          viewport: {
            type: 'string',
            enum: ['desktop', 'mobile'],
            description: 'Viewport size for screenshot: "desktop" (1440px width) or "mobile" (375px width). Default: desktop'
          },
          full_page: {
            type: 'boolean',
            description: 'Whether to capture the full page height or just the viewport. Default: false (viewport only)'
          }
        },
        required: ['url']
      }
    }
  }
];

// Log activity to activity-log.json with retry-on-conflict logic
async function logActivity(octokit, action, description, files = []) {
  const ACTIVITY_FILE = 'activity-log.json';
  const MAX_RETRIES = 3;

  const newActivity = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    action,
    description,
    files,
    status: 'completed'
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Fetch existing log (fresh on each retry)
      let activities = [];
      let sha = null;

      try {
        const existing = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: ACTIVITY_FILE,
          ref: 'main'
        });
        const content = Buffer.from(existing.data.content, 'base64').toString('utf-8');
        try {
          const parsed = JSON.parse(content);
          // Handle both formats: flat array or object with activities property
          activities = Array.isArray(parsed) ? parsed : (parsed.activities || []);
        } catch (jsonError) {
          console.error('Failed to parse activity log JSON:', jsonError.message);
          // Use default empty array if corrupted
          activities = [];
        }
        sha = existing.data.sha;
      } catch (e) {
        if (e.status !== 404) throw e;
      }

      // Add new activity
      activities.unshift(newActivity);

      // Keep only last 100
      if (activities.length > 100) {
        activities = activities.slice(0, 100);
      }

      // Save
      const updateParams = {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: ACTIVITY_FILE,
        message: `[Activity Log] ${action}: ${description}`,
        content: Buffer.from(JSON.stringify(activities, null, 2)).toString('base64'),
        branch: 'main'
      };

      if (sha) updateParams.sha = sha;

      await octokit.repos.createOrUpdateFileContents(updateParams);

      // Success! Exit retry loop
      if (attempt > 0) {
        console.log(`✅ Activity log updated successfully on attempt ${attempt + 1}`);
      }
      return;

    } catch (error) {
      // Check if it's a 409 conflict (stale SHA)
      if (error.status === 409 && attempt < MAX_RETRIES - 1) {
        console.warn(`⚠️ Activity log conflict on attempt ${attempt + 1}, retrying...`);
        // Wait a bit before retrying (exponential backoff with jitter)
        const delay = 100 * Math.pow(2, attempt) + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry with fresh SHA
      }

      console.error('Failed to log activity:', error.message);
      // Don't throw - activity logging shouldn't break the main operation
      return;
    }
  }
}

// HTML validation helper - prevents corrupted/incomplete HTML files
function validateHTMLContent(content, filePath) {
  if (!filePath.endsWith('.html')) return { valid: true };

  const requiredTags = ['<!DOCTYPE', '<html', '<head>', '</head>', '<body', '</body>', '</html>'];
  const missingTags = requiredTags.filter(tag => !content.includes(tag));

  if (missingTags.length > 0) {
    return {
      valid: false,
      error: `HTML file incomplete. Missing: ${missingTags.join(', ')}`,
      hint: 'File may be truncated. Check if content generation was cut off.'
    };
  }

  // Check for truncation markers
  const lastLine = content.trim().split('\n').pop();
  if (lastLine.length < 10 && !lastLine.includes('>')) {
    return {
      valid: false,
      error: 'HTML file appears truncated (last line is incomplete)',
      hint: `Last line: "${lastLine}"`
    };
  }

  return { valid: true };
}

// Determine if an error is retryable (network/timeout/rate limit errors)
function isRetryableError(errorMessage) {
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /rate limit/i,
    /429/,
    /502/,
    /503/,
    /504/
  ];

  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}

// Retry wrapper for tool execution with exponential backoff + jitter
async function executeToolWithRetry(name, args, octokit, maxRetries = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await executeFunction(name, args, octokit);

      // If result contains error, check if it's retryable
      if (result.error) {
        const isRetryable = isRetryableError(result.error);

        if (isRetryable && attempt < maxRetries) {
          // Calculate backoff with jitter: base * (2^attempt) + random(0-1000ms)
          const backoffMs = (1000 * Math.pow(2, attempt)) + Math.random() * 1000;
          console.log(`⚠️ Retryable error on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${backoffMs.toFixed(0)}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          lastError = result.error;
          continue;
        } else {
          // Non-retryable error or max retries reached
          return result;
        }
      }

      // Success - return result
      return result;

    } catch (error) {
      lastError = error.message;

      if (attempt < maxRetries) {
        const backoffMs = (1000 * Math.pow(2, attempt)) + Math.random() * 1000;
        console.log(`⚠️ Exception on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${backoffMs.toFixed(0)}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  // All retries failed
  return {
    error: lastError,
    retried: true,
    suggestion: 'The operation failed after multiple attempts. Please try again later or simplify your request.'
  };
}

// Security: Block dangerous file paths
const BLOCKED_PATTERNS = [
  /^api\//i,           // Block api/ directory
  /^\.env/i,           // Block .env files
  /^\.git/i,           // Block .git directory
  /^package\.json$/i,  // Block package.json
  /^vercel\.json$/i,   // Block vercel.json
  /^node_modules\//i   // Block node_modules
];

const ALLOWED_EXTENSIONS = ['.html', '.css', '.js', '.json', '.md', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

function isPathSafe(filePath) {
  // Check for path traversal
  if (filePath.includes('..') || filePath.includes('//')) {
    return { safe: false, reason: 'Path traversal detected' };
  }

  // Check blocked patterns
  if (BLOCKED_PATTERNS.some(pattern => pattern.test(filePath))) {
    return { safe: false, reason: 'Path matches blocked pattern (api/, .env, etc.)' };
  }

  // Check file extension
  const ext = path.extname(filePath).toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return { safe: false, reason: `File extension ${ext} not allowed` };
  }

  return { safe: true };
}

// SSRF protection: Validate URLs to block internal network access
function isUrlSafe(urlString) {
  try {
    const url = new URL(urlString);

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { safe: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Block private IP ranges and localhost
    const hostname = url.hostname.toLowerCase();

    // Block localhost variations
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return { safe: false, reason: 'Cannot access localhost' };
    }

    // Block cloud metadata endpoints
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      return { safe: false, reason: 'Cannot access cloud metadata endpoints' };
    }

    // Block private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const [, a, b, c, d] = match.map(Number);

      // 10.0.0.0/8
      if (a === 10) {
        return { safe: false, reason: 'Cannot access private network (10.x.x.x)' };
      }

      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) {
        return { safe: false, reason: 'Cannot access private network (172.16-31.x.x)' };
      }

      // 192.168.0.0/16
      if (a === 192 && b === 168) {
        return { safe: false, reason: 'Cannot access private network (192.168.x.x)' };
      }
    }

    return { safe: true };
  } catch (error) {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

// Call GitHub directly instead of through internal APIs
async function executeFunction(name, args, octokit) {
  try {
    switch (name) {
      case 'read_file': {
        console.log(`Reading file: ${args.path}`);
        const response = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          ref: 'main'
        });

        if (Array.isArray(response.data)) {
          return { error: 'Path is a directory, not a file' };
        }

        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return { path: args.path, content: content, sha: response.data.sha };
      }

      case 'edit_file': {
        console.log(`Editing file: ${args.path}`);
        console.log(`Looking for: "${args.old_text.substring(0, 50)}..."`);

        // Security check
        const pathCheck = isPathSafe(args.path);
        if (!pathCheck.safe) {
          return {
            error: `Cannot edit this file: ${pathCheck.reason}`,
            path: args.path
          };
        }

        // Get existing file content
        const existing = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          ref: 'main'
        });

        if (Array.isArray(existing.data)) {
          return { error: 'Path is a directory, not a file' };
        }

        const currentContent = Buffer.from(existing.data.content, 'base64').toString('utf-8');
        const sha = existing.data.sha;

        // Check if old_text exists in file
        if (!currentContent.includes(args.old_text)) {
          return {
            error: 'Text not found in file. Make sure old_text matches exactly (including whitespace).',
            hint: 'Use read_file first to see the exact content.'
          };
        }

        // Replace old_text with new_text (use replace_all parameter to control single vs all)
        const newContent = args.replace_all
          ? currentContent.replaceAll(args.old_text, args.new_text)
          : currentContent.replace(args.old_text, args.new_text);

        // Verify the change was made
        if (newContent === currentContent && args.old_text !== args.new_text) {
          console.warn('⚠️ Warning: Replacement did not modify content');
          console.warn('Old text not found. Trying fuzzy match...');

          // Try to find similar text with normalized whitespace
          const normalizedOld = args.old_text.trim().replace(/\s+/g, ' ');
          const normalizedContent = currentContent.trim().replace(/\s+/g, ' ');

          if (!normalizedContent.includes(normalizedOld)) {
            return {
              error: 'Text not found in file after normalization. Content may have changed.',
              hint: `Searched for: "${args.old_text.substring(0, 50)}..."`,
              suggestion: 'Use read_file first to see current exact content.'
            };
          }
        }

        // Validate HTML content after edit
        const validation = validateHTMLContent(newContent, args.path);
        if (!validation.valid) {
          console.error(`❌ HTML validation failed for ${args.path} after edit`);
          return {
            error: validation.error,
            hint: validation.hint,
            path: args.path,
            suggestion: 'Try a smaller edit or regenerate the full file.'
          };
        }

        // Validate content size
        const contentSizeKB = Buffer.byteLength(newContent, 'utf8') / 1024;
        if (contentSizeKB > 1000) { // 1MB limit
          return {
            error: `Generated content too large: ${contentSizeKB.toFixed(2)}KB (max 1000KB)`,
            hint: 'Break this into smaller edits or use create_file for new large files.'
          };
        }

        // Commit the change to GitHub
        const commitMessage = args.message || `Edit ${args.path}`;
        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          message: `[Davidson AI] ${commitMessage}`,
          content: Buffer.from(newContent).toString('base64'),
          sha: sha,
          branch: 'main'
        });

        // Note: Local filesystem operations removed (serverless environment)

        // Log activity
        await logActivity(octokit, 'edit', args.message || `Edited ${args.path}`, [args.path]);

        return {
          success: true,
          path: args.path,
          message: `Successfully replaced text in ${args.path}`
        };
      }

      case 'list_files': {
        console.log(`Listing files: ${args.path || '/'}`);
        const response = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path || '',
          ref: 'main'
        });

        if (!Array.isArray(response.data)) {
          return { error: 'Path is a file, not a directory' };
        }

        const files = response.data.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type
        }));

        return { path: args.path || '/', files: files };
      }

      case 'create_file': {
        console.log(`Creating new file: ${args.path}`);

        // Security check
        const pathCheck = isPathSafe(args.path);
        if (!pathCheck.safe) {
          return {
            error: `Cannot create this file: ${pathCheck.reason}`,
            path: args.path
          };
        }

        // Check if file already exists
        let existingSha = null;
        try {
          const existing = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: args.path,
            ref: 'main'
          });

          // File exists - check if overwrite is allowed
          if (!args.overwrite) {
            return {
              error: 'File already exists. Use edit_file to modify, set overwrite:true to replace, or choose a different path.',
              path: args.path
            };
          }

          // File exists and overwrite is true - save SHA for update
          existingSha = existing.data.sha;
          console.log(`File exists, overwriting with new content (overwrite=true)`);
        } catch (err) {
          // 404 means file doesn't exist - good, we can create it
          if (err.status !== 404) {
            throw err;
          }
        }

        // Validate HTML content before creating
        const validation = validateHTMLContent(args.content, args.path);
        if (!validation.valid) {
          console.error(`❌ HTML validation failed for ${args.path}`);
          return {
            error: validation.error,
            hint: validation.hint,
            path: args.path
          };
        }

        // Validate content size
        const contentSizeKB = Buffer.byteLength(args.content, 'utf8') / 1024;
        console.log(`📝 Creating file: ${args.path} (${contentSizeKB.toFixed(2)}KB)`);
        if (contentSizeKB > 1000) { // 1MB limit
          return {
            error: `Generated content too large: ${contentSizeKB.toFixed(2)}KB (max 1000KB)`,
            hint: 'Break this into smaller files or reduce content size.'
          };
        }

        // Create or update the file on GitHub
        const commitMessage = args.message || (existingSha ? `Update ${args.path}` : `Create ${args.path}`);
        const updateParams = {
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: args.path,
          message: `[Davidson AI] ${commitMessage}`,
          content: Buffer.from(args.content).toString('base64'),
          branch: 'main'
        };

        // Include SHA if overwriting existing file
        if (existingSha) updateParams.sha = existingSha;

        await octokit.repos.createOrUpdateFileContents(updateParams);

        // Note: Local filesystem operations removed (serverless environment)

        // Log activity
        await logActivity(octokit, 'create', args.message || `Created ${args.path}`, [args.path]);

        return {
          success: true,
          path: args.path,
          message: `Successfully created ${args.path}`
        };
      }

      case 'fetch_url': {
        console.log(`Fetching URL: ${args.url}`);

        // SECURITY: Validate URL to prevent SSRF
        const urlCheck = isUrlSafe(args.url);
        if (!urlCheck.safe) {
          console.warn(`🚫 Blocked fetch_url attempt: ${args.url} - ${urlCheck.reason}`);
          return { error: `Cannot fetch this URL: ${urlCheck.reason}` };
        }

        try {
          // Add 8-second timeout to prevent indefinite hangs
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);

          try {
            const response = await fetch(args.url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DavidsonBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
              },
              signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) {
              return { error: `Failed to fetch URL: ${response.status} ${response.statusText}` };
            }

            const contentType = response.headers.get('content-type') || '';
            let content = await response.text();

            // Truncate very long content to avoid token limits
            const maxLength = 10000;
            if (content.length > maxLength) {
              content = content.substring(0, maxLength) + '\n\n[Content truncated...]';
            }

            // Basic HTML to text conversion for readability
            if (contentType.includes('text/html')) {
              // Remove script and style tags and their content
              content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
              content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
              // Remove HTML tags but keep text
              content = content.replace(/<[^>]+>/g, ' ');
              // Clean up whitespace
              content = content.replace(/\s+/g, ' ').trim();
            }

            return {
              success: true,
              url: args.url,
              contentType: contentType,
              content: content
            };
          } catch (fetchError) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
              return { error: 'URL fetch timeout after 8 seconds. Try a different URL or check if the site is responsive.' };
            }
            throw fetchError;
          }
        } catch (fetchError) {
          return { error: `Failed to fetch URL: ${fetchError.message}` };
        }
      }

      case 'verify_live_content': {
        console.log(`Verifying live content at: ${args.url}`);

        // Retry with backoff: immediate, +5s, +10s (3 attempts total)
        const maxAttempts = 3;
        const delays = [0, 5000, 10000]; // ms

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (attempt > 0) {
            console.log(`Retry ${attempt + 1}/${maxAttempts} after ${delays[attempt]}ms delay`);
            await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout per attempt

          try {
            const response = await fetch(args.url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DavidsonBot/1.0)',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              },
              signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
              // HTTP error - retry
              if (attempt < maxAttempts - 1) continue;

              return {
                verified: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
                suggestion: 'Page may not be live yet or returned an error. Wait 30 seconds and try again.',
                url: args.url
              };
            }

            const html = await response.text();

            // Check for expected content strings
            const expectedContent = Array.isArray(args.expectedContent) ? args.expectedContent : [args.expectedContent];
            const foundAll = expectedContent.every(text => html.includes(text));

            if (foundAll) {
              return {
                verified: true,
                message: `All expected content found on live page at ${args.url}`,
                url: args.url,
                checked: expectedContent.length,
                attempts: attempt + 1
              };
            } else {
              // Content not found - retry
              if (attempt < maxAttempts - 1) continue;

              const missing = expectedContent.filter(text => !html.includes(text));
              return {
                verified: false,
                missing: missing,
                suggestion: 'Some content not found after 3 attempts. Deployment may still be propagating through CDN.',
                url: args.url,
                attempts: maxAttempts
              };
            }
          } catch (fetchError) {
            clearTimeout(timeout);

            // Network error - retry unless last attempt
            if (attempt < maxAttempts - 1) continue;

            if (fetchError.name === 'AbortError') {
              return {
                verified: false,
                error: 'Verification timeout after 15 seconds',
                suggestion: 'Could not verify live content. Server may be slow or deployment still in progress.',
                url: args.url,
                attempts: maxAttempts
              };
            }

            return {
              verified: false,
              error: `Failed to fetch page: ${fetchError.message}`,
              suggestion: 'Could not verify live content. Deployment may still be in progress.',
              url: args.url,
              attempts: maxAttempts
            };
          }
        }

        // Should never reach here, but just in case
        return {
          verified: false,
          error: 'Verification failed after all attempts',
          url: args.url,
          attempts: maxAttempts
        };
      }

      case 'screenshot_page': {
        console.log(`Taking screenshot of: ${args.url}`);

        // Check for screenshot API key
        if (!process.env.SCREENSHOT_API_KEY) {
          return {
            error: 'Screenshot service not configured',
            suggestion: 'Screenshots require SCREENSHOT_API_KEY environment variable to be set. Please contact administrator.'
          };
        }

        try {
          // Normalize URL (handle relative paths)
          let targetUrl = args.url;
          if (!targetUrl.startsWith('http')) {
            // Remove leading slash if present for consistency
            const path = targetUrl.startsWith('/') ? targetUrl.slice(1) : targetUrl;
            targetUrl = `${SITE_URL}/${path}`;
          }

          // Validate it's the Davidson site (security)
          const siteUrlBase = new URL(SITE_URL).hostname;
          const targetUrlBase = new URL(targetUrl).hostname;
          if (targetUrlBase !== siteUrlBase) {
            return {
              error: 'Can only screenshot pages on the Davidson & Co website',
              provided: targetUrl,
              expected: SITE_URL
            };
          }

          console.log(`Screenshot target: ${targetUrl}`);

          // Determine viewport dimensions
          const viewport = args.viewport || 'desktop';
          const viewportWidth = viewport === 'mobile' ? 375 : 1440;
          const fullPage = args.full_page || false;

          // Build ScreenshotOne API URL
          const screenshotApiUrl = new URL('https://api.screenshotone.com/take');
          screenshotApiUrl.searchParams.set('access_key', process.env.SCREENSHOT_API_KEY);
          screenshotApiUrl.searchParams.set('url', targetUrl);
          screenshotApiUrl.searchParams.set('viewport_width', viewportWidth.toString());
          screenshotApiUrl.searchParams.set('viewport_height', viewport === 'mobile' ? '812' : '900');
          screenshotApiUrl.searchParams.set('device_scale_factor', '1');
          screenshotApiUrl.searchParams.set('format', 'jpeg');
          screenshotApiUrl.searchParams.set('image_quality', '80');
          screenshotApiUrl.searchParams.set('block_ads', 'true');
          screenshotApiUrl.searchParams.set('block_cookie_banners', 'true');
          screenshotApiUrl.searchParams.set('block_trackers', 'true');
          screenshotApiUrl.searchParams.set('cache', 'false'); // Always get fresh content
          screenshotApiUrl.searchParams.set('delay', '3'); // Wait 3s for GSAP animations
          screenshotApiUrl.searchParams.set('full_page', fullPage.toString());

          console.log(`Calling ScreenshotOne API...`);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          try {
            const response = await fetch(screenshotApiUrl.toString(), {
              signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`ScreenshotOne API error: ${response.status} ${response.statusText}`);
              console.error(`Error details: ${errorText}`);
              return {
                error: `Screenshot service returned ${response.status}: ${response.statusText}`,
                suggestion: 'The screenshot service may be unavailable. Try again in a moment.'
              };
            }

            // Get image as buffer
            const imageBuffer = await response.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');

            console.log(`Screenshot captured successfully (${(imageBuffer.byteLength / 1024).toFixed(2)}KB)`);

            return {
              success: true,
              url: targetUrl,
              viewport: viewport,
              full_page: fullPage,
              screenshot: `data:image/jpeg;base64,${base64Image}`,
              message: `Screenshot captured for ${targetUrl} (${viewport} viewport)`,
              size_kb: (imageBuffer.byteLength / 1024).toFixed(2)
            };
          } catch (fetchError) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
              return {
                error: 'Screenshot timeout after 30 seconds',
                suggestion: 'The page may be slow to load. Try again or check if the page is accessible.'
              };
            }
            throw fetchError;
          }
        } catch (error) {
          console.error(`Screenshot error: ${error.message}`);
          return {
            error: `Failed to capture screenshot: ${error.message}`,
            suggestion: 'Check that the URL is correct and the page is accessible.'
          };
        }
      }

      default:
        return { error: 'Unknown function' };
    }
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error.message);
    return { error: error.message };
  }
}

// Helper function to detect if message contains uploaded images
function hasUploadedImages(content) {
  return /\[Uploaded image: ([^\]]+)\]/.test(content);
}

// Helper function to extract image paths from message
function extractImagePaths(content) {
  const regex = /\[Uploaded image: ([^\]]+)\]/g;
  const paths = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

// Helper function to get image extension and determine mime type
function getImageMimeType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// Convert message with image markers to vision API format
async function convertToVisionMessage(message, octokit) {
  if (!hasUploadedImages(message.content)) {
    return message; // No images, return as-is
  }

  console.log(`Converting message with images to vision format...`);
  const imagePaths = extractImagePaths(message.content);
  console.log(`Found ${imagePaths.length} image(s):`, imagePaths);

  let textContent = message.content;

  // Remove image markers from text
  textContent = textContent.replace(/\[Uploaded image: ([^\]]+)\]/g, '').trim();

  // Build content array with text and images
  const contentArray = [];

  // Add text part if there's any text
  if (textContent) {
    contentArray.push({
      type: 'text',
      text: textContent
    });
  }

  // Fetch and add each image
  for (const imagePath of imagePaths) {
    try {
      console.log(`Fetching image from GitHub: ${imagePath}`);
      // Fetch image from GitHub
      const response = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: imagePath,
        ref: 'main'
      });

      if (Array.isArray(response.data)) {
        console.warn(`Skipping ${imagePath} - it's a directory`);
        continue;
      }

      // Get base64 content (GitHub API returns base64)
      const base64Content = response.data.content.replace(/\n/g, '');
      const mimeType = getImageMimeType(imagePath);

      // Calculate approximate file size (base64 is ~4/3 original size)
      const approxSizeBytes = (base64Content.length * 3) / 4;
      const approxSizeMB = (approxSizeBytes / (1024 * 1024)).toFixed(2);

      console.log(`Image loaded: ${imagePath}`);
      console.log(`  - MIME type: ${mimeType}`);
      console.log(`  - Approx size: ${approxSizeMB}MB`);
      console.log(`  - Base64 length: ${base64Content.length} chars`);

      // Warn if image might be too large (OpenAI Vision API limit is 20MB)
      if (approxSizeBytes > 20 * 1024 * 1024) {
        console.warn(`⚠️  Image may exceed 20MB limit for OpenAI Vision API (${approxSizeMB}MB)`);
      }

      // Add image in OpenAI-compatible vision format
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Content}`
        }
      });
    } catch (error) {
      console.error(`Failed to fetch image ${imagePath}:`, error.message);
      // Add error note to text instead
      contentArray.push({
        type: 'text',
        text: `[Note: Could not load image ${imagePath}]`
      });
    }
  }

  console.log(`Vision message created with ${contentArray.length} content parts`);

  // Return message in vision format
  return {
    role: message.role,
    content: contentArray
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Track request start time for timeout management
  const REQUEST_START_TIME = Date.now();
  const MAX_REQUEST_TIME = 290000; // 290 seconds (10s safety margin from 300s limit)
  const TIMEOUT_WARNING_TIME = 270000; // 270 seconds (30s before timeout)

  console.log(`[TIMING] Request started at ${new Date().toISOString()}`);

  // Helper function to check if approaching timeout
  const isApproachingTimeout = () => {
    return (Date.now() - REQUEST_START_TIME) > TIMEOUT_WARNING_TIME;
  };

  const hasTimeRemaining = () => {
    return (Date.now() - REQUEST_START_TIME) < MAX_REQUEST_TIME;
  };

  // Check for required environment variables
  if (!process.env.GLM_API_KEY) {
    console.error('GLM_API_KEY environment variable not set');
    return res.status(500).json({
      error: 'API key not configured',
      message: 'The AI service is not properly configured. Please contact support.'
    });
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN environment variable not set');
    return res.status(500).json({
      error: 'GitHub token not configured',
      message: 'The file system is not properly configured. Please contact support.'
    });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Check if any message contains images
    const hasImages = messages.some(msg =>
      typeof msg.content === 'string' && hasUploadedImages(msg.content)
    );

    // Convert messages to vision format if images are present
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    let processedMessages = messages;

    if (hasImages) {
      console.log('Images detected, converting to vision format...');
      processedMessages = await Promise.all(
        messages.map(msg => convertToVisionMessage(msg, octokit))
      );
    }

    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...processedMessages
    ];

    // Helper function to retry API calls with exponential backoff
    const retryWithBackoff = async (fn, maxRetries = 2) => {
      let lastErr;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await fn();

          // Validate response structure
          if (!result || !result.choices || !Array.isArray(result.choices) || result.choices.length === 0) {
            throw new Error('Invalid API response structure: missing choices array');
          }

          if (!result.choices[0].message) {
            throw new Error('Invalid API response structure: missing message in first choice');
          }

          return result;
        } catch (err) {
          lastErr = err;
          console.error(`Attempt ${attempt + 1} failed:`, err.message);

          // Log more details for debugging
          if (err.response) {
            console.error(`API Response Status:`, err.response.status);
            console.error(`API Response Headers:`, err.response.headers);
          }

          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
            console.log(`Retrying after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      throw lastErr;
    };

    let response = null;
    let lastError = null;
    let usedModel = null;
    let toolsEnabled = true;


    // Use vision models if images are present, otherwise use regular models
    const modelsToTry = hasImages ? VISION_MODELS : MODELS;

    // Check if we have time remaining before making API call
    if (!hasTimeRemaining()) {
      return res.status(200).json({
        message: "Request is taking longer than expected. Please try breaking this into smaller tasks.",
        error: 'Timeout prevention',
        madeChanges: false
      });
    }

    // Try each model with tools first (with retry)
    for (const model of modelsToTry) {
      try {
        const llmStartTime = Date.now();
        console.log(`[TIMING] LLM API call started at ${llmStartTime - REQUEST_START_TIME}ms`);
        console.log(`Trying model: ${model} with tools ${hasImages ? '(VISION MODE)' : ''}`);
        response = await retryWithBackoff(async () => {
          return await glmClient.chat.completions.create({
            model: model,
            messages: fullMessages,
            tools: tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 16384
          });
        });
        usedModel = model;
        const llmDuration = Date.now() - llmStartTime;
        console.log(`[TIMING] LLM API call completed in ${llmDuration}ms`);
        console.log(`✅ Success with model: ${model}${hasImages ? ' (VISION)' : ''}`);
        break;
      } catch (err) {
        console.error(`❌ Model ${model} with tools failed:`, err.message);

        // Log detailed error for debugging
        if (err.response) {
          console.error(`API Response Status:`, err.response.status);
          console.error(`API Response Data:`, JSON.stringify(err.response.data, null, 2));
        }
        if (err.error) {
          console.error(`API Error Details:`, JSON.stringify(err.error, null, 2));
        }

        // Check for rate limiting - if so, throw immediately to return error to user
        if (err.status === 429 || err.message?.toLowerCase().includes('rate limit')) {
          console.error('❌ Rate limit hit - stopping retries');
          throw new Error('API rate limit exceeded. Please wait a moment and try again.');
        }

        lastError = err;
      }
    }

    // If tools failed, try without tools (with retry)
    if (!response) {
      console.log(`Trying without tools... ${hasImages ? '(VISION MODE)' : ''}`);
      toolsEnabled = false;
      for (const model of modelsToTry) {
        try {
          console.log(`Trying model: ${model} without tools ${hasImages ? '(VISION MODE)' : ''}`);
          response = await retryWithBackoff(async () => {
            return await glmClient.chat.completions.create({
              model: model,
              messages: fullMessages,
              temperature: 0.7,
              max_tokens: 16384
            });
          });
          usedModel = model;
          console.log(`Success with model: ${model} (no tools)`);
          break;
        } catch (err) {
          console.error(`Model ${model} without tools failed:`, err.message);

          // Check for rate limiting
          if (err.status === 429 || err.message?.toLowerCase().includes('rate limit')) {
            console.error('❌ Rate limit hit - stopping retries');
            throw new Error('API rate limit exceeded. Please wait a moment and try again.');
          }

          lastError = err;
        }
      }
    }

    // If vision models all failed and images were present, try with regular models as fallback
    if (!response && hasImages) {
      console.log('All vision models failed, falling back to text-only models...');
      toolsEnabled = false;

      // Convert image messages back to text-only by removing image content
      const textOnlyMessages = [
        { role: 'system', content: SYSTEM_PROMPT + '\n\nNOTE: Vision processing failed. User uploaded images but you cannot see them. Acknowledge this limitation and work with text only.' },
        ...messages
      ];

      for (const model of MODELS) {
        try {
          console.log(`Trying text model fallback: ${model}`);
          response = await retryWithBackoff(async () => {
            return await glmClient.chat.completions.create({
              model: model,
              messages: textOnlyMessages,
              temperature: 0.7,
              max_tokens: 16384
            });
          });
          usedModel = model;
          console.log(`Success with text fallback model: ${model}`);
          break;
        } catch (err) {
          console.error(`Text fallback model ${model} failed:`, err.message);
          lastError = err;
        }
      }
    }

    if (!response) {
      throw lastError || new Error('All models failed');
    }

    let assistantMessage = response.choices[0].message;
    let madeChanges = false; // Track if file changes were made

    // Check if response was truncated due to token limit
    if (response.choices[0].finish_reason === 'length') {
      console.error('⚠️ CRITICAL: AI response was truncated due to max_tokens limit!');
      console.error(`Model: ${usedModel}, Max tokens: 4096`);

      return res.status(500).json({
        message: 'I ran out of space while generating content. Let me try with a shorter response.',
        error: 'Response truncated - content not written to prevent corruption',
        madeChanges: false
      });
    }

    // Handle tool calls
    if (toolsEnabled) {
      // Log tool calls for debugging
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`🔧 AI requested ${assistantMessage.tool_calls.length} tool call(s)`);
        assistantMessage.tool_calls.forEach((tc, idx) => {
          console.log(`  ${idx + 1}. ${tc.function.name} (args length: ${tc.function.arguments.length} chars)`);
        });
      }

      // Prevent infinite tool loops
      let toolIterations = 0;
      const MAX_TOOL_ITERATIONS = 10;

      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && toolIterations < MAX_TOOL_ITERATIONS) {
        toolIterations++;
        fullMessages.push(assistantMessage);

        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;

          // Check timeout before each tool execution
          if (!hasTimeRemaining()) {
            console.error(`⚠️ Timeout approaching, skipping remaining tools`);

            fullMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                error: 'Request timeout - operation aborted to prevent function timeout',
                hint: 'Try breaking this request into smaller tasks'
              })
            });
            break; // Exit tool loop
          }

          // Log if approaching timeout
          if (isApproachingTimeout()) {
            console.warn('⚠️ Approaching timeout limit, may need to abort soon');
          }

          // Log tool execution with time tracking
          const toolStartTime = Date.now();
          const elapsedMs = toolStartTime - REQUEST_START_TIME;
          console.log(`🔧 Executing tool: ${functionName} (${elapsedMs}ms elapsed since request start)`);

          // Parse function arguments with detailed error handling
          let functionArgs;
          try {
            functionArgs = JSON.parse(toolCall.function.arguments);
          } catch (parseError) {
            console.error(`❌ JSON Parse Error for tool: ${functionName}`);
            console.error('Raw arguments string (first 500 chars):', toolCall.function.arguments.substring(0, 500));
            console.error('Parse error:', parseError.message);

            // Try to recover by cleaning common JSON issues
            try {
              // Remove control characters and fix common escaping issues
              const cleaned = toolCall.function.arguments
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control chars
                .replace(/\\/g, '\\\\') // Escape backslashes
                .replace(/\n/g, '\\n') // Escape newlines
                .replace(/\r/g, '\\r') // Escape carriage returns
                .replace(/\t/g, '\\t'); // Escape tabs

              functionArgs = JSON.parse(cleaned);
              console.log('✅ Recovered with cleaned JSON');
            } catch (recoveryError) {
              // If recovery fails, return error to LLM so it can retry
              const errorResult = {
                error: `Invalid JSON in tool arguments for ${functionName}. Please ensure all JSON is properly formatted and escaped.`,
                hint: `Parse error: ${parseError.message}`,
                suggestion: 'Try simplifying the content or breaking it into smaller sections.'
              };

              fullMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(errorResult)
              });

              // Continue to next tool call instead of crashing
              continue;
            }
          }

          const result = await executeToolWithRetry(functionName, functionArgs, octokit);

          // Log tool completion time
          const toolDuration = Date.now() - toolStartTime;
          console.log(`✅ Tool ${functionName} completed in ${toolDuration}ms`);

          // Track if changes were made (edit_file, create_file, or delete_file with success)
          if ((functionName === 'edit_file' || functionName === 'create_file' || functionName === 'delete_file') && result.success) {
            madeChanges = true;
          }

          // Add tool result to messages
          fullMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });

          // Special handling for screenshots: inject as vision message
          if (functionName === 'screenshot_page' && result.success && result.screenshot) {
            console.log('🖼️ Screenshot received, injecting as vision message for analysis');

            // Add a user message with the screenshot for vision analysis
            fullMessages.push({
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this screenshot of ${result.url}. Check for:\n1. Are all images loading correctly (no broken images)?\n2. Is the layout correct (no overlapping, proper spacing)?\n3. Are visual elements displaying as expected?\n4. Any other visual issues?\n\nProvide a brief analysis of what you see and whether the page looks correct.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: result.screenshot
                  }
                }
              ]
            });
          }
        }

        const llmStartTime2 = Date.now();
        console.log(`[TIMING] Second LLM API call started at ${llmStartTime2 - REQUEST_START_TIME}ms`);
        response = await retryWithBackoff(async () => {
          return await glmClient.chat.completions.create({
            model: usedModel,
            messages: fullMessages,
            tools: tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 16384
          });
        });

        const llmDuration2 = Date.now() - llmStartTime2;
        console.log(`[TIMING] Second LLM API call completed in ${llmDuration2}ms`);

        assistantMessage = response.choices[0].message;

        // Check if response was truncated in tool execution loop
        if (response.choices[0].finish_reason === 'length') {
          console.error('⚠️ CRITICAL: AI response truncated during tool execution!');
          return res.status(500).json({
            message: 'I ran out of space while processing. Let me try a simpler approach.',
            error: 'Response truncated during tool execution',
            madeChanges: madeChanges
          });
        }
      }

      // Check if we hit the iteration limit
      if (toolIterations >= MAX_TOOL_ITERATIONS) {
        console.error(`⚠️ Hit maximum tool iterations (${MAX_TOOL_ITERATIONS})`);
        return res.status(200).json({
          message: "I made too many changes in one go. Let me try a simpler approach. Please try breaking your request into smaller steps.",
          error: 'Maximum tool iterations reached',
          madeChanges: madeChanges
        });
      }
    }

    // Provide a fallback message if the AI returned empty content after making changes
    let finalMessage = assistantMessage.content;
    if (!finalMessage || finalMessage.trim() === '') {
      if (madeChanges) {
        finalMessage = "I've made the changes you requested. Would you like me to make any other adjustments?";
      } else {
        finalMessage = "I've processed your request. Is there anything else you'd like me to help with?";
      }
    }

    // Sanitize message to ensure valid JSON encoding
    // Remove problematic control characters but keep newlines, tabs, and carriage returns
    if (finalMessage) {
      finalMessage = finalMessage.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    }

    // Check if AI is requesting deletion confirmation
    let requestsDelete = null;
    const deleteMarker = 'DELETE_REQUEST:';
    if (finalMessage && finalMessage.includes(deleteMarker)) {
      const markerIndex = finalMessage.indexOf(deleteMarker);
      const pathStart = markerIndex + deleteMarker.length;
      const pathEnd = finalMessage.indexOf(' ', pathStart);
      const filePath = pathEnd > -1
        ? finalMessage.substring(pathStart, pathEnd)
        : finalMessage.substring(pathStart);

      // Remove the marker from the message
      finalMessage = finalMessage.replace(deleteMarker + filePath, '').trim();

      requestsDelete = {
        path: filePath.trim(),
        displayName: filePath.includes('/')
          ? filePath.split('/')[0]
          : filePath.replace('.html', '')
      };

      console.log('🗑️ Deletion requested:', requestsDelete);
    }

    const totalRequestTime = Date.now() - REQUEST_START_TIME;
    console.log(`[TIMING] Total request time: ${totalRequestTime}ms (${(totalRequestTime / 1000).toFixed(2)}s)`);

    return res.status(200).json({
      message: finalMessage,
      usage: response.usage,
      toolsEnabled: toolsEnabled,
      madeChanges: madeChanges,
      requestsDelete: requestsDelete
    });

  } catch (error) {
    console.error('Chat API error:', error);
    console.error('Error stack:', error.stack);

    // Provide beginner-friendly error messages with screenshot guidance
    let errorMessage = 'Failed to process request';
    let userFriendlyMessage = 'Something went wrong, but don\'t worry - this happens sometimes. I wasn\'t able to complete that task. Please take a screenshot of this conversation and send it to your admin. They\'ll be able to see what happened and help fix it.';

    const errMsg = error.message?.toLowerCase() || '';
    const errCode = error.code || '';

    if (errMsg.includes('timeout') || errCode === 'ETIMEDOUT' || errCode === 'ECONNABORTED') {
      userFriendlyMessage = 'That task took longer than expected, so I had to stop. Please take a screenshot and send it to your admin so they can help.';
    } else if (errMsg.includes('rate') || error.status === 429) {
      userFriendlyMessage = 'I\'m getting too many requests right now. Please wait a minute and try again. If this keeps happening, take a screenshot and send it to your admin.';
    } else if (errMsg.includes('network') || errCode === 'ECONNREFUSED' || errCode === 'ENOTFOUND') {
      userFriendlyMessage = 'I\'m having trouble connecting. Please check your internet connection and try again. If it still doesn\'t work, take a screenshot and send it to your admin.';
    } else if (error.status === 401 || error.status === 403 || errMsg.includes('unauthorized') || errMsg.includes('forbidden')) {
      userFriendlyMessage = 'I don\'t have permission to do that right now. Please take a screenshot of this conversation and send it to your admin - they\'ll need to fix the permissions.';
    } else if (error.status >= 500 || errMsg.includes('internal server error')) {
      userFriendlyMessage = 'The system is having a temporary issue. Please wait a moment and try again. If it still doesn\'t work, take a screenshot and send it to your admin.';
    } else if (errMsg.includes('invalid') || errMsg.includes('bad request')) {
      userFriendlyMessage = 'I didn\'t quite understand that request. Try saying it differently. If you keep seeing this message, take a screenshot and send it to your admin.';
    } else if (errMsg.includes('model') || errMsg.includes('not found')) {
      userFriendlyMessage = 'The system isn\'t available right now. Please try again in a few minutes. If it still doesn\'t work, take a screenshot and send it to your admin.';
    } else if (errMsg.includes('json') || errMsg.includes('parse')) {
      userFriendlyMessage = 'I had trouble understanding the response. Please try again. If this keeps happening, take a screenshot and send it to your admin.';
    }

    return res.status(500).json({
      error: errorMessage,
      message: userFriendlyMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
