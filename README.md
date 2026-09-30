# HTML Upload Portal

A very small Vercel app that uploads `.html` or `.htm` files to Vercel Blob and returns a public link.

Uploads use Vercel Blob client uploads, so files can be larger than the normal Vercel Function request limit. This version allows files up to 50 MB.

Direct Vercel Blob URLs download HTML files for security. The app returns a `/api/view` link that renders the uploaded HTML in the browser with a sandboxed content security policy.

## Deploy

1. Push this folder to GitHub.
2. Import it in Vercel.
3. In Vercel, add Blob storage to the project.
4. Make sure `BLOB_READ_WRITE_TOKEN` exists in the project environment variables.
5. Deploy.

Uploaded files are public, so do not upload private HTML.
