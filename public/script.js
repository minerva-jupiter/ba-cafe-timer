document.getElementById('tap-button').onclick = async () => {
    const res = await fetch('/api/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tapTime: new Date().toISOString() })
    });
    const data = await res.json();
    alert(data.success ? 'Recorded!' : 'Error');
};
