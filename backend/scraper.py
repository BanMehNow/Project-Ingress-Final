from urllib.parse import urljoin

from playwright.async_api import (
    async_playwright,
    TimeoutError as PlaywrightTimeoutError
)


async def scrape_url(url: str):
    try:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)

            try:
                page = await browser.new_page()

                response = await page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=30000
                )

                title = await page.title()

                description = ""
                description_locator = page.locator(
                    'meta[name="description"]'
                )

                if await description_locator.count() > 0:
                    description = (
                        await description_locator.first.get_attribute(
                            "content"
                        )
                    ) or ""

                body_text = await page.locator("body").inner_text(
                    timeout=10000
                )

                headings = await page.locator(
                    "h1, h2, h3, h4, h5, h6"
                ).all_inner_texts()

                raw_links = await page.locator(
                    "a[href]"
                ).evaluate_all(
                    """
                    elements => elements.map(
                        element => element.getAttribute('href')
                    )
                    """
                )

                links = [
                    urljoin(url, link)
                    for link in raw_links
                    if link
                ]

                cleaned_body_text = body_text.strip()

                return {
                    "url": url,
                    "title": title,
                    "description": description,
                    "body_text": cleaned_body_text,
                    "headings": headings,
                    "links": links,
                    "word_count": len(cleaned_body_text.split()),
                    "status_code": (
                        response.status if response else None
                    )
                }

            finally:
                await browser.close()

    except PlaywrightTimeoutError:
        return {
            "url": url,
            "title": "Timeout error",
            "description": "",
            "body_text": "",
            "headings": [],
            "links": [],
            "word_count": 0,
            "status_code": None
        }

    except Exception as error:
        return {
            "url": url,
            "title": "Scraping error",
            "description": "",
            "body_text": repr(error),
            "headings": [],
            "links": [],
            "word_count": 0,
            "status_code": None
        }