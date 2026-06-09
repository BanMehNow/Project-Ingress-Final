from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError


async def scrape_url(url: str):
    try:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)

            page = await browser.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)

            title = await page.title()
            body_text = await page.locator("body").inner_text(timeout=10000)

            await browser.close()

            return {
                "url": url,
                "title": title,
                "content": body_text[:3000]
            }

    except PlaywrightTimeoutError:
        return {
            "url": url,
            "title": "Timeout error",
            "content": "The page took too long to load or did not finish loading properly."
        }

    except Exception as error:
        return {
            "url": url,
            "title": "Scraping error",
            "content": repr(error)
        }