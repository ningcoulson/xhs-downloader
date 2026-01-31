import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    const filename = request.nextUrl.searchParams.get('filename') || 'download.mp4';
    const inline = request.nextUrl.searchParams.get('inline') === 'true';

    if (!url) {
        return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.xiaohongshu.com/',
            }
        });

        if (!response.ok) {
            return new NextResponse(`Failed to fetch media: ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const headers = new Headers();
        const disposition = inline ? 'inline' : 'attachment';
        headers.set('Content-Disposition', `${disposition}; filename="${filename}"`);
        headers.set('Content-Type', contentType);
        headers.set('Content-Length', buffer.length.toString());

        return new NextResponse(buffer, { status: 200, headers });
    } catch (error) {
        return NextResponse.json({ error: 'Proxy failed', details: (error as Error).message }, { status: 500 });
    }
}
