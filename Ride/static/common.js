function showToast(msg){
    const toastEl = document.getElementById("successToast");
    const msgBox = document.getElementById("toastMsg");
    
    msgBox.textContent = msg;

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}