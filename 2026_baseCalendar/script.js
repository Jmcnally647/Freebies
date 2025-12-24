document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  // Monthly background images
  const monthBackgrounds = [
    '', // Placeholder for index 0
    'url(assets/january.jpg)', 'url(assets/february.jpg)', 'url(assets/march.jpg)',
    'url(assets/april.jpg)', 'url(assets/may.jpg)', 'url(assets/june.jpg)',
    'url(assets/july.jpg)', 'url(assets/august.jpg)', 'url(assets/september.jpg)',
    'url(assets/october.jpg)', 'url(assets/november.jpg)', 'url(assets/december.jpg)'
  ];

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    initialDate: '2026-01-01',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    height: 'auto',

    // Change background when month changes
    datesSet: function(info) {
      const month = info.view.currentStart.getMonth() + 1; // 1-12
      document.querySelector('.fc-scrollgrid').style.backgroundImage = monthBackgrounds[month];
    },

    // Predefined holidays
    events: [
      { title: 'New Year’s Day 🎉', start: '2026-01-01', image: 'assets/newyear.jpg', video: 'https://www.youtube.com/embed/YourVideoID', description: 'Happy 2026!' },
      { title: 'Valentine’s Day ❤️', start: '2026-02-14', image: 'assets/valentine.jpg', video: 'https://www.youtube.com/embed/AnotherID', description: 'Spread the love!' },
      { title: 'Halloween 🎃', start: '2026-10-31', image: 'assets/halloween.jpg', video: 'https://www.youtube.com/embed/SpookyID' },
      { title: 'Christmas 🎄', start: '2026-12-25', image: 'assets/christmas.jpg', video: 'https://www.youtube.com/embed/ChristmasID' }
      // Add more holidays here
    ],

    // Click on a date (empty or with event)
    dateClick: function(info) {
      if (info.dateStr < '2026-01-01' || info.dateStr > '2026-12-31') return;
      openNoteModal(info.dateStr);
    },

    // Click on an event
    eventClick: function(info) {
      if (info.event.extendedProps.isUserNote) {
        // User note clicked
        document.getElementById('modalTitle').textContent = info.event.title;
        document.getElementById('modalImage').style.display = 'none';
        document.getElementById('modalVideo').innerHTML = '';
        document.getElementById('modalDescription').innerHTML = `
          <strong>Your note:</strong><br>
          <p style="background:#f8f9fa; padding:12px; border-left:4px solid #3498db; margin:15px 0; border-radius:4px;">
            ${info.event.extendedProps.userNote.replace(/\n/g, '<br>')}
          </p>
          <button onclick="openNoteModal('${info.event.startStr}')" class="pdf-btn" style="background:#3498db;">Edit Note</button>
          <button onclick="deleteUserNote('${info.event.startStr}')" style="background:#e74c3c; margin-left:10px;">Delete</button>
        `;
      } else {
        // Predefined holiday
        document.getElementById('modalTitle').textContent = info.event.title;
        const img = document.getElementById('modalImage');
        const vid = document.getElementById('modalVideo');
        const desc = document.getElementById('modalDescription');

        if (info.event.extendedProps.image) {
          img.src = info.event.extendedProps.image;
          img.style.display = 'block';
        } else {
          img.style.display = 'none';
        }

        if (info.event.extendedProps.video) {
          vid.innerHTML = `<iframe src="${info.event.extendedProps.video}?autoplay=1" allowfullscreen></iframe>`;
        } else {
          vid.innerHTML = '';
        }

        desc.textContent = info.event.extendedProps.description || '';
      }
      document.getElementById('eventModal').style.display = 'flex';
    }
  });

  calendar.render();

  // === Load saved user notes from localStorage ===
  const savedNotes = JSON.parse(localStorage.getItem('2026-calendar-notes') || '[]');
  savedNotes.forEach(note => {
    calendar.addEvent({
      title: note.title || '📝 Note',
      start: note.date,
      allDay: true,
      backgroundColor: '#3498db',
      borderColor: '#2980b9',
      extendedProps: { userNote: note.text, isUserNote: true }
    });
  });

  // === Close modal ===
  document.querySelector('.close').onclick = () => {
    document.getElementById('eventModal').style.display = 'none';
    document.getElementById('modalVideo').innerHTML = '';
  };

  window.onclick = (e) => {
    if (e.target === document.getElementById('eventModal')) {
      document.getElementById('eventModal').style.display = 'none';
      document.getElementById('modalVideo').innerHTML = '';
    }
  };

  // === Note Functions ===
  window.openNoteModal = function(dateStr) {
    const existing = calendar.getEvents().find(e => e.startStr === dateStr && e.extendedProps.isUserNote);
    const currentNote = existing ? existing.extendedProps.userNote : '';
    const currentTitle = existing ? existing.title.replace('📝 ', '') : '';

    document.getElementById('modalTitle').textContent = 'Personal Note';
    document.getElementById('modalImage').style.display = 'none';
    document.getElementById('modalVideo').innerHTML = '';
    document.getElementById('modalDescription').innerHTML = `
      <strong>${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong><br><br>
      <input type="text" id="noteTitle" placeholder="Title (optional)" value="${currentTitle}" style="width:100%; padding:10px; font-size:16px; border-radius:6px; border:1px solid #ccc;"><br><br>
      <textarea id="noteText" placeholder="Write your note here..." style="width:100%; height:180px; padding:10px; font-size:16px; border-radius:6px; border:1px solid #ccc;">${currentNote}</textarea><br><br>
      <button onclick="saveUserNote('${dateStr}')" class="pdf-btn" style="background:#27ae60; padding:12px 24px;">${existing ? 'Update' : 'Save'} Note</button>
      ${existing ? '<button onclick="deleteUserNote(\'' + dateStr + '\')" style="background:#e74c3c; margin-left:12px; padding:12px 24px;">Delete</button>' : ''}
    `;
    document.getElementById('eventModal').style.display = 'flex';
  };

  window.saveUserNote = function(dateStr) {
    const titleInput = document.getElementById('noteTitle').value.trim();
    const text = document.getElementById('noteText').value.trim();
    if (!text) {
      alert('Please write something in your note!');
      return;
    }

    // Remove old note if exists
    const oldEvent = calendar.getEvents().find(e => e.startStr === dateStr && e.extendedProps.isUserNote);
    if (oldEvent) oldEvent.remove();

    // Add new/updated note
    calendar.addEvent({
      title: titleInput ? '📝 ' + titleInput : '📝 Note',
      start: dateStr,
      allDay: true,
      backgroundColor: '#3498db',
      borderColor: '#2980b9',
      extendedProps: { userNote: text, isUserNote: true }
    });

    // Save all notes to localStorage
    const allNotes = calendar.getEvents()
      .filter(e => e.extendedProps.isUserNote)
      .map(e => ({
        date: e.startStr,
        title: e.title,
        text: e.extendedProps.userNote
      }));
    localStorage.setItem('2026-calendar-notes', JSON.stringify(allNotes));

    document.getElementById('eventModal').style.display = 'none';
    alert('Note saved successfully! 🎉');
  };

  window.deleteUserNote = function(dateStr) {
    if (!confirm('Permanently delete this note?')) return;

    const event = calendar.getEvents().find(e => e.startStr === dateStr && e.extendedProps.isUserNote);
    if (event) event.remove();

    // Update localStorage
    const allNotes = calendar.getEvents()
      .filter(e => e.extendedProps.isUserNote)
      .map(e => ({
        date: e.startStr,
        title: e.title,
        text: e.extendedProps.userNote
      }));
    localStorage.setItem('2026-calendar-notes', JSON.stringify(allNotes));

    document.getElementById('eventModal').style.display = 'none';
  };

  // === PDF Export (unchanged) ===
  document.getElementById('downloadPdf').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFontSize(22);
    pdf.text('My Beautiful 2026 Calendar', pageWidth / 2, 20, { align: 'center' });
    let y = 35;

    for (let month = 0; month < 12; month++) {
      const date = new Date(2026, month, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      calendar.gotoDate(date);
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(document.querySelector('#calendar'), {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (y > pageHeight - 30) { pdf.addPage(); y = 20; }
      pdf.setFontSize(16);
      pdf.text(`${monthName} 2026`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      const imgHeight = (canvas.height * (pageWidth - 20) / canvas.width);
      let heightLeft = imgHeight;
      let positionY = y;
      pdf.addImage(imgData, 'JPEG', 10, positionY, pageWidth - 20, imgHeight);
      heightLeft -= (pageHeight - positionY - 10);

      while (heightLeft > 0) {
        pdf.addPage();
        positionY = 10;
        pdf.addImage(imgData, 'JPEG', 10, positionY, pageWidth - 20, imgHeight, null, 'FAST', 0, -(imgHeight - heightLeft));
        heightLeft -= (pageHeight - 20);
      }

      y = 20;
      if (month < 11) pdf.addPage();
    }

    pdf.save('My-2026-Calendar-with-Notes.pdf');
    alert('PDF generated! Check your downloads 📥');
  });
});