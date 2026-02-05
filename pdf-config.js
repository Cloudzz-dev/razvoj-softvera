module.exports = {
    stylesheet: [
        'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown-light.min.css'
    ],
    body_class: 'markdown-body',
    pdf_options: {
        format: 'A4',
        margin: '20mm',
        printBackground: true,
    },
    launch_options: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
};