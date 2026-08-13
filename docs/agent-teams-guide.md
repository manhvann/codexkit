# Agent Teams trong CodexKit

> Đây là hướng dẫn khái niệm cho các runtime Codex có hỗ trợ cộng tác nhiều
> agent. CodexKit cung cấp skill và quy tắc hướng dẫn; repo này không triển
> khai scheduler, task service, mailbox hay hạ tầng team hosted.

## Khi nào nên dùng

Agent teams phù hợp với công việc có các nhánh độc lập như:

- khảo sát nhiều hướng kỹ thuật;
- review bảo mật và review chất lượng song song;
- thay đổi backend, frontend và tài liệu có ranh giới file rõ ràng.

Với một thay đổi nhỏ, dùng một session thường đơn giản và dễ kiểm chứng hơn.

## Trước khi bắt đầu

1. Kiểm tra runtime hiện tại có công cụ cộng tác nào.
2. Xác định rõ file hoặc module mà mỗi agent được phép sửa.
3. Gửi cho mỗi agent mục tiêu, tiêu chí hoàn thành và cách báo cáo kết quả.
4. Không đưa token, dữ liệu cá nhân hoặc nội dung private vào prompt.

Một runtime có thể yêu cầu bật feature thử nghiệm trong `settings.json`; tên
flag và cú pháp thay đổi theo phiên bản, nên không nên copy mù quáng từ tài
liệu của phiên bản khác.

## Quy trình đề xuất

```text
Lead xác định mục tiêu
        │
        ├── Scout: tìm file, ràng buộc và rủi ro
        ├── Worker A: thay đổi module A
        ├── Worker B: thay đổi module B
        └── Reviewer: kiểm tra diff và tiêu chí chấp nhận
        │
Lead hợp nhất kết quả → chạy check → cập nhật docs
```

Lead nên giữ một danh sách task persistent trong `plans/` nếu công việc kéo
dài qua nhiều session. Task trong runtime chỉ nên được xem là state tạm thời,
trừ khi runtime hiện tại có cơ chế lưu trữ rõ ràng.

## Quy tắc an toàn khi phối hợp

- Mỗi file chỉ nên có một owner tại một thời điểm.
- Agent không được hoàn tác thay đổi của agent khác khi chưa kiểm tra diff.
- Kết quả phải kèm đường dẫn file, kiểm tra đã chạy và vấn đề còn mở.
- Không giả định team đã có quyền push, publish hoặc truy cập repository private.
- Lead phải chạy lại kiểm tra từ workspace cuối cùng trước khi kết luận hoàn tất.

## Liên hệ với skill

Các skill orchestration trong `.agents/skills/` có thể cung cấp template cho
scout, plan, cook, review hoặc debug. Gọi skill bằng cú pháp `$skill` theo
README; capability thực tế vẫn phụ thuộc runtime Codex đang chạy.

## Giới hạn hiện tại của repo

CodexKit hiện không chứa:

- workflow CI hoặc release tự động;
- máy chủ điều phối team;
- hệ thống lưu task ngoài các file plan;
- cam kết tương thích với một phiên bản runtime cụ thể.

Hãy coi các ví dụ team là playbook tham khảo và xác minh capability trước khi
thực thi.
