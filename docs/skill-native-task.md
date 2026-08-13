# Quản lý task trong CodexKit

> Tài liệu này mô tả pattern, không khẳng định runtime nào cũng có cùng API
> task. Hãy kiểm tra công cụ được cung cấp trong session Codex hiện tại trước
> khi áp dụng.

## Hai lớp theo dõi

### Plan persistent

File Markdown trong `plans/` là nguồn state có thể xem lại sau khi session kết
thúc. Dùng checkbox, phase và tiêu chí nghiệm thu để ghi lại tiến độ.

### Task runtime

Nếu runtime có công cụ task, dùng chúng để theo dõi công việc trong session:

- tạo task cho các bước độc lập;
- gán owner và dependency;
- cập nhật trạng thái khi bắt đầu và hoàn tất;
- đồng bộ kết quả về plan trước khi kết thúc session.

Tên operation, schema và khả năng persistence có thể khác giữa các runtime.

## Quy tắc chọn mức độ

| Quy mô | Cách làm đề xuất |
|---|---|
| Một hoặc hai bước | Checklist trực tiếp trong prompt hoặc plan |
| Từ ba bước có dependency | Plan có phase + task runtime nếu được hỗ trợ |
| Nhiều agent song song | Ranh giới file rõ, một lead tổng hợp, reviewer cuối |

## Vòng đời chuẩn

```text
plan → chia bước → assign → in progress → verify → completed → sync-back
```

Trước khi chạy, đọc plan và đánh dấu các bước đã hoàn thành. Trong lúc làm,
ghi lại bằng chứng kiểm tra thay vì chỉ đổi trạng thái. Khi kết thúc, cập nhật
checkbox, kết quả kiểm thử và vấn đề còn tồn đọng.

## Metadata tối thiểu nên có

Mỗi task nên nêu:

- mục tiêu và file/module sở hữu;
- dependency hoặc điều kiện bắt đầu;
- tiêu chí hoàn thành;
- lệnh kiểm tra cần chạy;
- rủi ro và câu hỏi cần lead quyết định.

Ví dụ dạng Markdown portable:

```markdown
- [ ] Implement metadata validation
  - owner: maintainer
  - files: scripts/validate-codex-kit-metadata.mjs
  - verify: npm run check
  - depends_on: none
```

## Pattern cho skill

- `$plan`: tạo phases, dependency và tiêu chí nghiệm thu.
- `$cook`: thực hiện các bước theo plan, kiểm tra sau mỗi thay đổi.
- `$fix`: điều tra nguyên nhân trước, rồi mới sửa và verify.
- `$code-review`: review diff, edge case và tài liệu trước khi bàn giao.

Nếu runtime không có task API, dùng plan Markdown và báo cáo theo cùng cấu
trúc; không tự tạo một API giả hoặc ghi rằng task đã được persistence.

## Handoff giữa agent

Một handoff tốt phải gồm:

1. việc đã làm và file đã chạm;
2. kiểm tra đã chạy cùng kết quả;
3. giả định hoặc giới hạn;
4. bước tiếp theo rõ ràng.

Không chuyển secret, token, dữ liệu cá nhân hay đường dẫn máy cá nhân vào
handoff hoặc issue công khai.

## Giới hạn hiện tại

Repo này không triển khai task database, scheduler, mailbox hay CI workflow.
Các tính năng cộng tác phụ thuộc Codex runtime và cấu hình người dùng. Trước
khi công bố một capability, hãy kiểm tra lại bằng lệnh hoặc công cụ thực tế và
cập nhật tài liệu nếu hành vi thay đổi.
