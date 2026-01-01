import http.server
import socketserver
import json
import os
import cgi
import sys

PORT = 3000
CONTENTS_DIR = "Contents"
MANIFEST_FILE = os.path.join(CONTENTS_DIR, "manifest.json")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/login':
            self.handle_login()
        elif self.path == '/api/upload':
            self.handle_upload()
        else:
            self.send_error(404, "Not Found")

    def handle_login(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if data.get('username') == 'root' and data.get('password') == '123456':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            else:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "message": "Invalid credentials"}).encode('utf-8'))
        except Exception as e:
            self.send_error(500, str(e))

    def handle_upload(self):
        try:
            # Parse multipart form data
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST',
                         'CONTENT_TYPE': self.headers['Content-Type'],
                         }
            )

            book_name = form.getvalue('bookName')
            description = form.getvalue('description')
            
            if not book_name or not description:
                raise ValueError("Missing required fields")

            # Create directories
            book_dir = os.path.join(CONTENTS_DIR, book_name)
            images_dir = os.path.join(book_dir, "images")
            data_dir = os.path.join(book_dir, "data")
            
            os.makedirs(images_dir, exist_ok=True)
            os.makedirs(data_dir, exist_ok=True)

            # Helper to save file
            def save_file(field_name, dest_dir):
                if field_name in form and form[field_name].filename:
                    file_item = form[field_name]
                    filename = os.path.basename(file_item.filename)
                    filepath = os.path.join(dest_dir, filename)
                    with open(filepath, 'wb') as f:
                        f.write(file_item.file.read())
                    return filename
                return None

            cover_file = save_file('cover', images_dir)
            infographic_file = save_file('infographic', images_dir)
            audio_persian_file = save_file('audioPersian', data_dir)
            audio_english_file = save_file('audioEnglish', data_dir)
            pdf_file = save_file('pdf', data_dir)

            # Update manifest
            with open(MANIFEST_FILE, 'r', encoding='utf-8') as f:
                manifest = json.load(f)

            new_book = {
                "title": book_name,
                "description": description,
                "folder": book_name,
                "cover": cover_file,
                "infographic": infographic_file,
                "audioPersian": audio_persian_file,
                "audioEnglish": audio_english_file,
                "pdf": pdf_file
            }

            manifest['books'].append(new_book)

            with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=4, ensure_ascii=False)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        except Exception as e:
            print(f"Error: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "message": str(e)}).encode('utf-8'))

print(f"Serving on port {PORT}")
# Allow address reuse to prevent "Address already in use" errors on restart
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    httpd.serve_forever()
