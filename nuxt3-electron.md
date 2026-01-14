# Yêu cầu: Ứng dụng Claude Workspace - Phiên bản Vite + ElectronJS

Tạo một ứng dụng desktop có tên **"Claude Workspace"** - trình quản lý terminal đa tab cho các phiên làm việc Claude Code. Ứng dụng cần được xây dựng bằng **Vue 3** cho frontend và **ElectronJS** cho shell desktop.

## Tổng quan Dự án

Xây dựng ứng dụng desktop đa nền tảng cho phép người dùng:
- Mở nhiều tab terminal, mỗi tab chạy Claude CLI trong một thư mục cụ thể
- Lưu và quản lý thư mục làm việc hiện tại
- Theo dõi lịch sử các thư mục đã mở gần đây
- Duyệt hệ thống file để chọn thư mục

## Công nghệ Sử dụng

- **Vite** + **electron-vite** - Build tool
- **Vue 3** - Frontend framework
- **ElectronJS** - Wrapper ứng dụng desktop
- **Tailwind CSS v4** - Styling
- **Iconify + Lucide** - Icon system
- **Pinia** - State management
- **node-pty** - Quản lý tiến trình terminal
- **xterm.js** - Trình giả lập giao diện terminal
- **TypeScript** - An toàn kiểu dữ liệu xuyên suốt

## Tính năng Chính

### 1. Giao diện Terminal Đa Tab
- Tạo tab terminal mới (Cmd/Ctrl+T)
- Đóng tab (Cmd/Ctrl+W)
- Chuyển đổi giữa các tab (Cmd/Ctrl+Tab, nhấp chuột)
- Mỗi tab hiển thị tên thư mục
- Terminal tự động điều chỉnh kích thước theo container khi thay đổi

### 2. Phiên Terminal
- Mỗi tab sinh ra một tiến trình PTY sử dụng node-pty
- Tự động chạy lệnh `claude` khi tạo terminal
- Hỗ trợ loại terminal xterm-256color
- I/O thời gian thực giữa xterm.js và tiến trình PTY
- Hỗ trợ UTF-8 cho tiếng Việt và Unicode
- Dọn dẹp đúng cách khi đóng tab

### 3. Working Folder (Thư mục Làm việc)
- Mỗi lần vào app sẽ làm việc với 1 folder duy nhất
- Folder này được lưu lại cho các lần vào sau
- Hiển thị working folder hiện tại trong sidebar
- Có thể thay đổi folder bất kỳ lúc nào
- Khi mở app lần tiếp theo, tự động mở tab với working folder đã lưu

### 4. Lịch sử Thư mục
- Theo dõi 50 thư mục đã mở gần nhất
- Hiển thị trong sidebar với tên folder và timestamp
- Nhấp để mở lại trong tab mới và cập nhật working folder
- Tùy chọn xóa lịch sử
- Lưu trữ lịch sử vào file

### 5. Modal Duyệt Thư mục
- Điều hướng hệ thống file để chọn thư mục
- Chỉ hiển thị thư mục (lọc bỏ file và thư mục ẩn)
- Điều hướng kiểu breadcrumb
- Được sử dụng cho cả tạo tab mới và thay đổi working folder

### 6. Thiết lập Lần đầu (First-time Setup)
- Khi chạy ứng dụng lần đầu tiên, hiển thị màn hình Welcome/Onboarding
- Kiểm tra file `settings.json` để xác định đây có phải lần chạy đầu tiên không
- Màn hình thiết lập bao gồm:
  - Lời chào và giới thiệu ngắn về ứng dụng
  - Yêu cầu người dùng chọn 1 thư mục làm việc
  - Hiển thị trình duyệt thư mục để chọn folder
  - Nút "Bỏ qua" để bỏ qua bước này
  - Nút "Get Started" để lưu và bắt đầu sử dụng
- Sau khi hoàn tất thiết lập:
  - Lưu trạng thái `firstTimeSetupCompleted: true` vào `settings.json`
  - Lưu `workingFolder` vào `settings.json`
  - Thêm folder vào history
  - Tự động mở tab terminal với folder đã chọn

## Giao tiếp IPC

Định nghĩa các kênh IPC cho giao tiếp giữa tiến trình chính ↔ renderer của Electron:

| Kênh | Hướng | Mục đích |
|------|-------|----------|
| `pty:create` | Renderer → Main | Tạo phiên PTY mới |
| `pty:input` | Renderer → Main | Gửi input đến PTY |
| `pty:resize` | Renderer → Main | Thay đổi kích thước terminal |
| `pty:close` | Renderer → Main | Đóng phiên PTY |
| `pty:output` | Main → Renderer | Dữ liệu output từ PTY |
| `pty:exit` | Main → Renderer | Tiến trình PTY đã thoát |
| `fs:browse` | Renderer → Main | Liệt kê nội dung thư mục |
| `fs:home` | Renderer → Main | Lấy thư mục home của người dùng |
| `settings:get` | Renderer → Main | Đọc cài đặt ứng dụng |
| `settings:set` | Renderer → Main | Lưu cài đặt ứng dụng |
| `settings:isFirstTime` | Renderer → Main | Kiểm tra lần chạy đầu tiên |
| `history:get` | Renderer → Main | Lấy lịch sử |
| `history:add` | Renderer → Main | Thêm vào lịch sử |
| `history:clear` | Renderer → Main | Xóa lịch sử |

## Thiết kế Giao diện

- Giao diện tối với thẩm mỹ hiện đại bằng Tailwind v4
- Sidebar bên trái (có thể thu gọn) với working folder và lịch sử
- Thanh tab ở trên cùng vùng nội dung chính
- Terminal chiếm phần không gian còn lại
- Dialog modal cho chọn thư mục
- Responsive khi thay đổi kích thước cửa sổ

## Lưu trữ Dữ liệu

Lưu dữ liệu trong thư mục userData của Electron:
- `/settings.json` - Cài đặt ứng dụng:
  - `firstTimeSetupCompleted`: boolean
  - `sidebarCollapsed`: boolean
  - `workingFolder`: string (đường dẫn thư mục làm việc)
  - `windowBounds`: { x, y, width, height }
- `/history.json` - Lịch sử thư mục đã mở (mảng { path, name, timestamp })

## Phím tắt

- `Cmd/Ctrl + T` - Tab mới (mở trình chọn thư mục)
- `Cmd/Ctrl + W` - Đóng tab hiện tại
- `Cmd/Ctrl + Tab` - Tab tiếp theo
- `Cmd/Ctrl + Shift + Tab` - Tab trước đó
- `Cmd/Ctrl + 1-9` - Chuyển đến tab theo số thứ tự

## Hỗ trợ Nền tảng

- macOS (darwin)
- Windows (win32)

Sử dụng shell phù hợp: user's default shell ($SHELL) trên Unix, `powershell.exe` trên Windows.

## Cấu hình Build

Thiết lập electron-builder để đóng gói:
- macOS: Trình cài đặt DMG
- Windows: Trình cài đặt NSIS

## Yêu cầu Bổ sung

1. Sử dụng Vue 3 Composition API với cú pháp `<script setup>`
2. Triển khai các kiểu TypeScript đúng cách cho tất cả component và store
3. Lưu lịch sử kể cả khi đóng ứng dụng
4. Hỗ trợ lưu trữ trạng thái cửa sổ (kích thước, vị trí)
5. Hỗ trợ UTF-8 cho nhập liệu tiếng Việt
