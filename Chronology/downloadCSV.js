const downloadCSVBtn = document.getElementById('export_button')

downloadCSVBtn.addEventListener('click', async (e) => {
  const permissionGranted = await browser.permissions.request({permissions: ['downloads']})
  if (permissionGranted) {
    const dataFromTable =  getDataFromTable()
    exportToCsv('Simple_Counter_Button_Chronology.csv', dataFromTable)
  } 
})

const exportToCsv = (filename, rows) => {
  let processRow = function (row) {
      let finalVal = '';
      for (let j = 0; j < row.length; j++) {
          let innerValue = row[j] === null ? '' : row[j].toString();
          if (row[j] instanceof Date) {
              innerValue = row[j].toLocaleString();
          };
          let result = innerValue.replace(/"/g, '""');
          if (result.search(/("|,|\n)/g) >= 0)
              result = '"' + result + '"';
          if (j > 0)
              finalVal += ',';
          finalVal += result;
      }
      return finalVal + '\n';
  };

  let csvFile = '';
  for (let i = 0; i < rows.length; i++) {
      csvFile += processRow(rows[i]);
  }

  let blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  browser.downloads.download({
    url: url,
    filename: filename
  })

}

const getDataFromTable = () => {
  let csv_data = [];

  let rows = document.getElementsByTagName('tr');
  for (let i = 0; i < rows.length; i++) {

      let cols = rows[i].querySelectorAll('td,th');

      let csvrow = [];
      for (let j = 1; j < cols.length; j++) {
          csvrow.push(cols[j].innerHTML);
      }

      csv_data.push(csvrow);
  }

  return csv_data
}