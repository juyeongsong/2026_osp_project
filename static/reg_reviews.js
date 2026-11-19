(() => {
  const input = document.getElementById("photo");
  const preview = document.querySelector(".dropzone__preview");
  const MAX_FILES = 4;
  const MAX_MB = 5;
  let objectUrl = null;

  const reset = () => {
    input.value = "";
    preview.hidden = true;
  };

  input.addEventListener("change", () => {
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    const files = [...input.files];
    if (!files.length) return reset();

    if (files.length > MAX_FILES) {
      alert(`사진은 최대 ${MAX_FILES}장까지 올릴 수 있어요.`);
      return reset();
    }
    for (const f of files) {
      if (!["image/jpeg", "image/png"].includes(f.type)) {
        alert("JPG, PNG 사진만 올릴 수 있어요.");
        return reset();
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        alert(`${MAX_MB}MB 이하 사진만 올릴 수 있어요.`);
        return reset();
      }
    }
    objectUrl = URL.createObjectURL(files[0]);
    preview.src = objectUrl;
    preview.hidden = false;
  });

  document.getElementById("cancel").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.href = "/review";
  });
})();
