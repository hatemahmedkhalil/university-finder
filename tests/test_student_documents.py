"""Tests for /student-documents — the personal document locker."""
import io


def _upload(client, headers, name="Transcript", doc_type="transcript", filename="doc.pdf", content=b"%PDF-1.4 fake", ctype="application/pdf"):
    # name/doc_type MUST be sent as multipart form fields (data=), matching
    # exactly what the real frontend's FormData upload sends — the endpoint
    # used to declare these as plain params (implicitly query-only), so a
    # test using params= here was silently testing the wrong contract and
    # never caught that real uploads always landed as doc_type="other".
    return client.post(
        "/student-documents",
        data={"name": name, "doc_type": doc_type},
        files={"file": (filename, io.BytesIO(content), ctype)},
        headers=headers,
    )


def test_list_documents_empty(client, student_headers):
    r = client.get("/student-documents", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_upload_document(client, student_headers):
    r = _upload(client, student_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Transcript"
    assert body["doc_type"] == "transcript"


def test_upload_document_requires_auth(client):
    r = client.post("/student-documents", files={"file": ("x.pdf", io.BytesIO(b"x"), "application/pdf")})
    assert r.status_code == 401


def test_upload_document_bad_extension_rejected(client, student_headers):
    r = _upload(client, student_headers, filename="malware.exe", content=b"MZ", ctype="application/octet-stream")
    assert r.status_code == 422


def test_upload_document_bad_mime_rejected(client, student_headers):
    r = _upload(client, student_headers, filename="doc.pdf", ctype="application/x-msdownload")
    assert r.status_code == 422


def test_upload_document_unknown_doc_type_falls_back_to_other(client, student_headers):
    r = _upload(client, student_headers, doc_type="not-a-real-type")
    assert r.status_code == 201
    assert r.json()["doc_type"] == "other"


def test_list_documents(client, student_headers):
    _upload(client, student_headers)
    r = client.get("/student-documents", headers=student_headers)
    assert len(r.json()) == 1


def test_list_documents_isolated_between_users(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_doclocker@test.com")
    bob = register_and_login(client, db, "bob_doclocker@test.com")
    _upload(client, alice)

    r = client.get("/student-documents", headers=bob)
    assert r.json() == []


def test_download_document(client, student_headers):
    uploaded = _upload(client, student_headers, content=b"%PDF-1.4 unique content here").json()
    r = client.get(f"/student-documents/{uploaded['id']}/download", headers=student_headers)
    assert r.status_code == 200
    assert b"unique content here" in r.content


def test_download_document_not_found(client, student_headers):
    r = client.get("/student-documents/999999/download", headers=student_headers)
    assert r.status_code == 404


def test_download_document_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_dl2@test.com")
    bob = register_and_login(client, db, "bob_dl2@test.com")
    uploaded = _upload(client, alice).json()

    r = client.get(f"/student-documents/{uploaded['id']}/download", headers=bob)
    assert r.status_code == 404


def test_rename_document(client, student_headers):
    uploaded = _upload(client, student_headers).json()
    r = client.patch(f"/student-documents/{uploaded['id']}", json={"name": "New Name", "doc_type": "cv"}, headers=student_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "New Name"
    assert r.json()["doc_type"] == "cv"


def test_rename_document_not_found(client, student_headers):
    r = client.patch("/student-documents/999999", json={"name": "x"}, headers=student_headers)
    assert r.status_code == 404


def test_delete_document(client, student_headers):
    uploaded = _upload(client, student_headers).json()
    r = client.delete(f"/student-documents/{uploaded['id']}", headers=student_headers)
    assert r.status_code == 204
    assert client.get("/student-documents", headers=student_headers).json() == []


def test_delete_document_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_del@test.com")
    bob = register_and_login(client, db, "bob_del@test.com")
    uploaded = _upload(client, alice).json()

    r = client.delete(f"/student-documents/{uploaded['id']}", headers=bob)
    assert r.status_code == 404
