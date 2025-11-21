export function saveToken(token){ localStorage.setItem('hf_token', token); }
export function getToken(){ return localStorage.getItem('hf_token'); }
export function clearToken(){ localStorage.removeItem('hf_token'); }
