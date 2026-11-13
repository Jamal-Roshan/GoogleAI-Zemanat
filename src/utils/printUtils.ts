/**
 * High-reliability printing utility for web apps and sandboxed iframes
 */

export function printElementById(elementId: string, title: string = 'چاپ سند رسمی'): void {
  const target = document.getElementById(elementId);
  if (!target) {
    window.print();
    return;
  }

  try {
    // 1. Create a hidden print iframe
    const iframeId = 'applet_print_frame';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (iframe) {
      document.body.removeChild(iframe);
    }

    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Collect all stylesheets and style tags from current document
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          ${styles}
          <style>
            @page {
              size: auto;
              margin: 6mm;
            }
            body {
              background: white !important;
              color: black !important;
              font-family: 'Vazir', sans-serif !important;
              direction: rtl !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div style="padding: 0; margin: 0; background: white; color: black;">
            ${target.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print after resources load
    setTimeout(() => {
      try {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print():', err);
        window.print();
      }
    }, 300);
  } catch (err) {
    console.warn('Print helper error, invoking window.print():', err);
    window.print();
  }
}
