# Yêu cầu: Ứng dụng Claude Workspace - Phiên bản Nuxt3 + ElectronJS

Tạo một ứng dụng desktop có tên **"Claude Workspace"** - trình quản lý terminal đa tab cho các phiên làm việc Claude Code. Ứng dụng cần được xây dựng bằng **Nuxt3** cho frontend và **ElectronJS** cho shell desktop.

## Tổng quan Dự án

Xây dựng ứng dụng desktop đa nền tảng cho phép người dùng:
- Mở nhiều tab terminal, mỗi tab chạy Claude CLI trong một thư mục cụ thể
- Quản lý các thư mục preset để truy cập nhanh
- Theo dõi lịch sử phiên làm việc của các thư mục đã mở gần đây
- Duyệt hệ thống file để chọn thư mục

## Công nghệ Sử dụng

- **Vite** Vite
- **ElectronJS** - Wrapper ứng dụng desktop
- **UI** - Tailwind v4
- **Icon** - Sử dụng iconify và bộ lucide icon
- **node-pty** - Quản lý tiến trình terminal
- **xterm.js** - Trình giả lập giao diện terminal
- **TypeScript** - An toàn kiểu dữ liệu xuyên suốt

## Tính năng Chính

### 1. Giao diện Terminal Đa Tab
- Tạo tab terminal mới (Ctrl+T)
- Đóng tab (Ctrl+W)
- Chuyển đổi giữa các tab (Ctrl+Tab, nhấp chuột)
- Mỗi tab hiển thị tên thư mục
- Terminal tự động điều chỉnh kích thước theo container khi thay đổi

### 2. Phiên Terminal
- Mỗi tab sinh ra một tiến trình PTY sử dụng node-pty
- Tự động chạy lệnh `claude` khi tạo terminal
- Hỗ trợ loại terminal xterm-256color
- I/O thời gian thực giữa xterm.js và tiến trình PTY
- Dọn dẹp đúng cách khi đóng tab

### 3. Thư mục Preset
- Phần sidebar hiển thị các thư mục preset đã lưu
- Nhấp vào preset để mở tab mới trong thư mục đó
- Thêm preset mới (tên + đường dẫn)
- Xóa preset hiện có
- Lưu trữ preset vào file

### 4. Lịch sử Phiên làm việc
- Theo dõi 50 thư mục đã mở gần nhất
- Hiển thị trong sidebar với timestamp
- Nhấp để mở lại trong tab mới
- Tùy chọn xóa lịch sử
- Lưu trữ lịch sử vào file

### 5. Modal Duyệt Thư mục
- Điều hướng hệ thống file để chọn thư mục
- Chỉ hiển thị thư mục (lọc bỏ file và thư mục ẩn)
- Điều hướng kiểu breadcrumb
- Được sử dụng cho cả tạo tab mới và tạo preset

### 6. Thiết lập Lần đầu (First-time Setup)
- Khi chạy ứng dụng lần đầu tiên, hiển thị màn hình Welcome/Onboarding
- Kiểm tra file `settings.json` để xác định đây có phải lần chạy đầu tiên không
- Màn hình thiết lập bao gồm:
  - Lời chào và giới thiệu ngắn về ứng dụng
  - Yêu cầu người dùng chọn ít nhất 1 thư mục preset
  - Hiển thị trình duyệt thư mục để chọn các folder làm việc thường xuyên
  - Cho phép đặt tên cho mỗi preset (mặc định là tên thư mục)
  - Nút "Thêm preset" để thêm nhiều thư mục
  - Nút "Bỏ qua" để bỏ qua bước này (có thể thêm preset sau)
  - Nút "Hoàn tất" để lưu và bắt đầu sử dụng
- Sau khi hoàn tất thiết lập:
  - Lưu trạng thái `firstTimeSetupCompleted: true` vào `settings.json`
  - Lưu các preset đã chọn vào `presets.json`
  - Tự động mở tab terminal với preset đầu tiên (nếu có)
- Có thể reset thiết lập từ menu Settings

### 7. Tab Autocomplete - Gợi ý File/Folder
- Tương tự chức năng tab completion trong terminal (như `cd` + Tab)
- Khi user nhấn phím `Tab` trong terminal, gợi ý các file/folder trong thư mục hiện tại
- Tính năng autocomplete:
  - Gợi ý file/folder dựa trên prefix đang gõ
  - Hiển thị popup danh sách suggestions bên dưới cursor
  - Dùng phím mũi tên để chọn suggestion
  - Nhấn `Enter` hoặc `Tab` để chọn và điền vào terminal
  - Nhấn `Esc` để đóng popup
- Hiển thị suggestions:
  - Icon phân biệt file và folder
  - Folder hiển thị màu khác với file
  - Sắp xếp: folder trước, file sau (theo alphabet)
  - Ẩn file/folder bắt đầu bằng `.` (có option để hiện)
- Hỗ trợ path completion:
  - Gợi ý theo đường dẫn tương đối (`./`, `../`)
  - Gợi ý theo đường dẫn tuyệt đối (`/`)
  - Gợi ý tên preset khi gõ `@` + Tab (quick access)
- Performance:
  - Cache danh sách file/folder để tăng tốc độ
  - Giới hạn số lượng suggestions hiển thị (tối đa 10-15 items)
  - Debounce khi user gõ nhanh

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
| `fs:autocomplete` | Renderer → Main | Lấy danh sách file/folder cho autocomplete |

## Thiết kế Giao diện

- Giao diện tối với thẩm mỹ hiện đại bằng tailwind v4
- Sidebar bên trái (có thể thu gọn) với preset và lịch sử
- Thanh tab ở trên cùng vùng nội dung chính
- Terminal chiếm phần không gian còn lại
- Dialog modal cho chọn thư mục và tạo preset
- Responsive khi thay đổi kích thước cửa sổ

## Lưu trữ Dữ liệu

Lưu dữ liệu phù hợp với macOS và Windows (trong thư mục userData của Electron)
- `/settings.json` - Cài đặt ứng dụng (bao gồm trạng thái first-time setup)
- `/presets.json` - Danh sách thư mục preset
- `/history.json` - Lịch sử phiên làm việc

## Phím tắt

- `Ctrl/Cmd + T` - Tab mới (mở trình chọn thư mục)
- `Ctrl/Cmd + W` - Đóng tab hiện tại
- `Ctrl/Cmd + Tab` - Tab tiếp theo
- `Ctrl/Cmd + Shift + Tab` - Tab trước đó
- `Ctrl/Cmd + 1-9` - Chuyển đến tab theo số thứ tự

## Hỗ trợ Nền tảng

- macOS (darwin)
- Windows (win32)

Sử dụng shell phù hợp: `bash` trên Unix, `powershell.exe` trên Windows.

## Cấu hình Build

Thiết lập electron-builder để đóng gói:
- macOS: Trình cài đặt DMG
- Windows: Trình cài đặt NSIS

## Yêu cầu Bổ sung

1. Sử dụng Vue 3 Composition API với cú pháp `<script setup>`
2. Triển khai các kiểu TypeScript đúng cách cho tất cả component và store
3. Lưu lịch sử chat kể cả khi đóng ứng dụng
4. Hỗ trợ lưu trữ trạng thái cửa sổ (kích thước, vị trí)
5. Thêm menu ứng dụng với các action tiêu chuẩn
6. Bao gồm icon ứng dụng cho tất cả nền tảng
