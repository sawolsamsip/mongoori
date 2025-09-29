(() => {
    const form = document.getElementById('form')
    const cnameEl = document.getElementById('Cname')
    const onameEl = document.getElementById('Oname')
    const fileInput = document.getElementById('file-input');
    const dropzone = document.getElementById('dropzone');
    const uploadBtn = document.getElementById('upload-btn');
    const counterEl = document.getElementById('counter');
    const grid = document.getElementById('grid');
    const msgEl = document.getElementById('msg')
  
    
    const ACCEPT = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const MAX_MB = 5;
    const MAX_B = MAX_MB * 1024 * 1024;

    
    //
    ['dragenter','dragover','dragleave','drop'].forEach(evt =>
      document.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); }, false)
    );
  
    // highlight
    ['dragenter','dragover'].forEach(evt =>
      dropzone.addEventListener(evt, () => dropzone.classList.add('highlight'))
    );
    ['dragleave','drop'].forEach(evt =>
      dropzone.addEventListener(evt, () => dropzone.classList.remove('highlight'))
    );
    
    // file selection
    dropzone.addEventListener('drop', e => handleFiles(e.dataTransfer?.files || []));
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));
    
    async function handleFiles(fileListLike) {
        const f = Array.from(fileListLike).find(f => f && ACCEPT.includes(f.type));
        if (!f) return;

        if (f.size > MAX_B) {
            showMsg("file is too large. Max 5 MB", 'error');
            clearSelection();
            return;
        }

        const dt = new DataTransfer();
        dt.items.add(f);
        fileInput.files = dt.files;

        await refreshUI(f);
    }

    async function refreshUI(file) {
        grid.innerHTML = '';
        counterEl.textContent = 'Selected file: 1';

        const imgEl = document.createElement('img');
        imgEl.className = 'Preview-img';
        
        const previewUrl = await createPreview(file, 512);
        imgEl.src = previewUrl;
        grid.appendChild(imgEl);

        const rm = document.createElement('button');
        rm.type = 'button';
        rm.textContent  = 'Remove';
        rm.onclick = () => clearSelection();
        grid.appendChild(rm);
      }

    function clearSelection(){
        fileInput.value = '';
        grid.innerHTML = '';
        counterEl.textContent = 'Selected file: 0';
    }

    function showMsg(text, kind='ok'){
        msgEl.textContent = text;
        msgEl.className = kind === 'error' ? 'msg error' : 'msg ok';
        setTimeout(() => {
            msgEl.textContent = '';
            msgEl.className = 'msg';
        }, 3000);
    }

    async function createPreview(file, maxSize = 512) {
        const img = await createImageBitmap(file);

        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        return canvas.toDataURL("image/jpeg", 0.85);
    }

    uploadBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        msgEl.textContent = '';
        if (!cnameEl.value || !onameEl.value) {
            return showMsg('Please fill in all fields', 'error');
        }
        if (!fileInput.files.length) {
            return showMsg('Please select an image', 'error');
        }

        const formData = new FormData();
        formData.append('Cname', cnameEl.value);
        formData.append('Oname', onameEl.value);
        formData.append('Image', fileInput.files[0], fileInput.files[0].name);

        try {
            const res = await fetch('/api/upload',{ method : 'POST', body : formData});
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (!data.ok) throw new Error(data.message || 'Upload failed.');

            showMsg(data.message || 'Submission successful.');
            form.reset();
            clearSelection();
        } catch (err){
            console.error(err);
            showMsg(err.message || 'Error occurred.', 'error');
        }
    });
  })();