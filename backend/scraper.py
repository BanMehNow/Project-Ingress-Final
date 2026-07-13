from urllib.parse import urljoin  # this turns relative links into full urls

from playwright.async_api import (  # playwright drives a real browser for the scraping
    async_playwright,  # this is the entry point for launching a browser
    TimeoutError as PlaywrightTimeoutError  # renamed so it doesnt clash with pythons builtin TimeoutError
)


async def scrape_url(url: str):  # this loads a page and pulls out title, text, links etc
    try:  # this makes sure a browser/page failure doesnt crash the whole thing
        async with async_playwright() as playwright:  # this starts playwright, and it closes itself when the block ends
            browser = await playwright.chromium.launch(headless=True)  # its headless so no window actually pops up

            try:  # this is a separate try so the browser always closes even if scraping fails
                page = await browser.new_page()  # this opens a new tab

                response = await page.goto(  # this goes to the url
                    url,
                    wait_until="domcontentloaded",  # it doesnt wait on every image/script, just the html
                    timeout=30000  # it gives up after 30 secs
                )

                title = await page.title()  # this is the <title> tag

                description = ""  # this stays empty if theres no meta description
                description_locator = page.locator(
                    'meta[name="description"]'
                )

                if await description_locator.count() > 0:  # it only bothers if the tag exists
                    description = (
                        await description_locator.first.get_attribute(
                            "content"
                        )
                    ) or ""  # or "" incase the attribute comes back null

                body_text = await page.locator("body").inner_text(  # this is all the visible text on the page
                    timeout=10000
                )

                headings = await page.locator(
                    "h1, h2, h3, h4, h5, h6"
                ).all_inner_texts()  # this is every heading on the page, as a list

                raw_links = await page.locator(
                    "a[href]"
                ).evaluate_all(  # this runs a bit of JS inside the page itself to grab the href off each link
                    """
                    elements => elements.map(
                        element => element.getAttribute('href')
                    )
                    """
                )

                links = [  # this turns the raw hrefs into full links
                    urljoin(url, link)  # it handles relative links like "/about"
                    for link in raw_links
                    if link  # it skips empty ones
                ]

                return {
                    "url": url,
                    "title": title,
                    "description": description,
                    "body_text": body_text.strip(),
                    "headings": headings,
                    "links": links,
                    "word_count": len(body_text.split()),  # this is a rough word count, it just splits on whitespace
                    "status_code": (
                        response.status if response else None
                    )
                }

            finally:  # this always runs, even if something above threw
                await browser.close()

    except PlaywrightTimeoutError:  # this means the page took too long to respond
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

    except Exception as error:  # this catches anything else that goes wrong
        return {
            "url": url,
            "title": "Scraping error",
            "description": "",
            "body_text": repr(error),  # it keeps the error message here so its easier to debug later
            "headings": [],
            "links": [],
            "word_count": 0,
            "status_code": None
        }
