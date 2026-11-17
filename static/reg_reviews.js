(() => {
  const input = document.getElementById("photo");
  const preview = document.querySelector(".dropzone__preview");
  const MAX_MB = 5;
  let objectUrl = null;

  const reset = () => {
    input.value = "";
    preview.hidden = true;
  };

  input.addEventListener("change", () => {
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    const file = input.files[0];
    if (!file) return reset();

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("JPG, PNG 사진만 올릴 수 있어요.");
      return reset();
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`${MAX_MB}MB 이하 사진만 올릴 수 있어요.`);
      return reset();
    }
    objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.hidden = false;
  });

  document.getElementById("cancel").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.href = "/review";
  });
})();
