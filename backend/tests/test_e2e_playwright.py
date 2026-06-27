import os
import sys
import time
from playwright.sync_api import sync_playwright

def run_e2e():
    print("[E2E] Starting end-to-end integration tests using Playwright...")
    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # 1. Navigate to landing page
            print("[E2E] Navigating to Landing Page (http://localhost:5173)...")
            page.goto("http://localhost:5173")
            page.wait_for_load_state("networkidle")
            
            # Verify landing page heading
            assert "StuntGuard" in page.content(), "Landing page did not load StuntGuard title!"
            print("[E2E] Landing page loaded successfully.")

            # 2. Navigate to Login Page
            print("[E2E] Navigating to Login Page (http://localhost:5173/login)...")
            page.goto("http://localhost:5173/login")
            page.wait_for_load_state("networkidle")

            # Fill in credentials
            print("[E2E] Typing login credentials...")
            page.fill("#email", "parent@demo.com")
            page.fill("#password", "password")

            # Click submit button
            print("[E2E] Clicking login submit button...")
            page.click("button:has-text('Masuk ke Dashboard')")
            
            # Wait for redirect to dashboard
            print("[E2E] Waiting for redirection...")
            page.wait_for_url("**/app/*", timeout=15000)

            # Verify navigation to dashboard
            print(f"[E2E] Current URL after login: {page.url}")
            assert "/app/parent" in page.url or "/app/admin" in page.url, "Login did not redirect to dashboard!"
            print("[E2E] Logged in successfully. Redirected to dashboard.")

            # 3. Test Chatbot page (which opens the global popup and redirects back to parent app)
            print("[E2E] Navigating to Chatbot Page (http://localhost:5173/chatbot)...")
            page.goto("http://localhost:5173/chatbot")
            page.wait_for_load_state("networkidle")

            # Click suggestions or input message
            print("[E2E] Typing message in chatbot input...")
            input_selector = "input[placeholder='Tulis pertanyaan gizi balita...']"
            page.wait_for_selector(input_selector)
            page.fill(input_selector, "Apa itu stunting?")
            
            print("[E2E] Sending message by pressing Enter...")
            page.press(input_selector, "Enter")
            
            # Wait for response message
            print("[E2E] Waiting for chatbot reply...")
            # First wait for the loading indicator to disappear
            page.locator("div[role='status']").wait_for(state="hidden", timeout=25000)
            
            # Get the second assistant reply container
            reply_locator = page.locator("div.border-slate-200.bg-white").nth(1)
            reply_locator.wait_for(state="visible", timeout=5000)
            
            # Verify reply is loaded
            reply_text = reply_locator.inner_text()
            print(f"[E2E] Chatbot reply: {reply_text}")
            assert "stunting" in reply_text.lower() or "edukasi" in reply_text.lower() or "balita" in reply_text.lower(), "Chatbot response not loaded properly!"
            print("[E2E] Chatbot response verified successfully.")

            print("[E2E] E2E Playwright tests completed successfully. All check points passed!")
            sys.exit(0)

        except Exception as e:
            print(f"[E2E] Error encountered during tests: {e}")
            # Take screenshot on failure
            try:
                page.screenshot(path="e2e_failure_screenshot.png")
                print("[E2E] Screenshot saved as e2e_failure_screenshot.png")
            except Exception as se:
                print(f"[E2E] Could not save screenshot: {se}")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    run_e2e()
