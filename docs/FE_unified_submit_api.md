# NEXUS Unified Form Submission API (Frontend Guide)

## Endpoint

**POST** `/api/submit`

Submit form data to the backend for unified processing and Zoho CRM integration.

---

## General Request Format
- Content-Type: `application/json`
- All fields are case-sensitive.
- The `module_name` field determines which module the data is submitted to.

---

## Supported Modules & Payloads

### 1. Careers
Submit a job application.

**Payload Example:**
```json
{
  "module_name": "careers",
  "fullname": "John Doe",
  "emailid": "john.doe@example.com",
  "mobile": "9876543210",
  "jobTitle": "Senior Developer",
  "cvUpload": {
    "name": "john_resume.pdf",
    "size": 2097152
  }
}
```
**Notes:**
- `cvUpload.size` must be less than or equal to 10MB (10485760 bytes).
- All fields are required except `cvUpload` (but recommended).

---

## Careers Module: Real File Upload (CV)

To upload a CV file, the frontend must send a `multipart/form-data` POST request. The `cvUpload` field should be sent as a file, not as JSON.

### Example (Postman or HTML Form)

| Key         | Value                  | Type      |
|-------------|------------------------|-----------|
| module_name | careers                | Text      |
| fullname    | John Doe               | Text      |
| emailid     | john.doe@example.com   | Text      |
| mobile      | 9876543210             | Text      |
| jobTitle    | Senior Developer       | Text      |
| cvUpload    | (choose your PDF file) | File      |

**In Postman:**
- Set method to `POST` and URL to `http://<your-backend>/api/submit`
- In the Body tab, select `form-data`
- Add the above fields, making sure `cvUpload` is set to type `File`

**In HTML:**
```html
<form action="/api/submit" method="POST" enctype="multipart/form-data">
  <input type="hidden" name="module_name" value="careers" />
  <input type="text" name="fullname" />
  <input type="text" name="emailid" />
  <input type="text" name="mobile" />
  <input type="text" name="jobTitle" />
  <input type="file" name="cvUpload" />
  <button type="submit">Submit</button>
</form>
```

**In JavaScript (fetch):**
```js
const formData = new FormData();
formData.append('module_name', 'careers');
formData.append('fullname', 'John Doe');
formData.append('emailid', 'john.doe@example.com');
formData.append('mobile', '9876543210');
formData.append('jobTitle', 'Senior Developer');
formData.append('cvUpload', fileInput.files[0]);

fetch('/api/submit', {
  method: 'POST',
  body: formData
});
```

---

**Note:**
- Do NOT send `cvUpload` as a JSON object. It must be a file field in the form data.
- The backend will handle the file upload and attach it to the Zoho CRM record.

---

### 2. Newsletters
Subscribe a user to the newsletter.

**Payload Example:**
```json
{
  "module_name": "newsletters",
  "emailId": "test@example.com"
}
```
**Notes:**
- Only `emailId` is required.

---

### 3. Contacts (Contact Us Form)
**Payload Example:**
```json
{
  "module_name": "contacts",
  "firstName": "Jane",
  "lastName": "Smith",
  "organisation": "Acme Corp",
  "typeOfOrganisation": "Startup",
  "country": "India",
  "phoneNumber": "1234567890",
  "email": "jane.smith@example.com",
  "message": "I want to know more.",
  "privacyPolicy": true
}
```

---

### 4. eBook Requests
**Payload Example:**
```json
{
  "module_name": "ebook",
  "firstName": "Alex",
  "lastName": "Johnson",
  "email": "alex.johnson@example.com",
  "nameOfOrganisation": "Techies Ltd.",
  "country": "USA",
  "privacyPolicy": true
}
```

---

## Response Format
- On success:
```json
{
  "success": true,
  "id": "<zoho_record_id>",
  "message": "Form submitted successfully to <Module>"
}
```
- On error:
```json
{
  "success": false,
  "error": "<error_message>"
}
```

---

## Additional Notes
- Always use the correct `module_name` (case-sensitive): `careers`, `newsletters`, `contacts`, `ebook`.
- For file uploads, only the file name and size are required in the payload (actual file upload is handled separately).
- If you need to add reCAPTCHA, include a `recaptchaToken` field.

---

For any questions, contact the backend team. 