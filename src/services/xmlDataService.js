const fetchXmlData = (filePath) => {
    return fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
            return xmlDoc; // Return the parsed XML document object
        })
        .catch(error => {
            console.error("Error fetching the XML file: ", error);
        });
};

const parseVmaXmlToJson = (xmlDoc) => {
    // Initialize an array to hold our VMAs
    let vmas = [];
  
    // Get all VMA elements from the XML
    const vmaNodes = xmlDoc.getElementsByTagName('vma');
    for (let vma of vmaNodes) {
      // Parse attributes of the VMA
      let vmaObject = {
        start: vma.getAttribute('start'),
        end: vma.getAttribute('end'),
        pages: [],
        pagesInVMA: parseInt(vma.getElementsByTagName('pagesInVMA')[0].textContent, 10)
      };
  
      // Get all page elements within this VMA
      const pageNodes = vma.getElementsByTagName('page');
      for (let page of pageNodes) {
        // Parse attributes and child elements of the page
        let pageObject = {
          addr: page.getAttribute('addr'),
          present: parseInt(page.getElementsByTagName('present')[0].textContent, 10),
          read_write: parseInt(page.getElementsByTagName('read_write')[0].textContent, 10),
          user_supervisor: parseInt(page.getElementsByTagName('user_supervisor')[0].textContent, 10),
          page_write_through: parseInt(page.getElementsByTagName('page_write_through')[0].textContent, 10),
          page_cache_disabled: parseInt(page.getElementsByTagName('page_cache_disabled')[0].textContent, 10),
          accessed: parseInt(page.getElementsByTagName('accessed')[0].textContent, 10),
          dirty: parseInt(page.getElementsByTagName('dirty')[0].textContent, 10),
          page_access_type: parseInt(page.getElementsByTagName('page_access_type')[0].textContent, 10),
          global: parseInt(page.getElementsByTagName('global')[0].textContent, 10),
          protection_key: parseInt(page.getElementsByTagName('protection_key')[0].textContent, 10),
          execute_disable: parseInt(page.getElementsByTagName('execute_disable')[0].textContent, 10),
        };
  
        // Add this page to the VMA's pages array
        vmaObject.pages.push(pageObject);
      }
  
      // Add this VMA to the VMAs array
      vmas.push(vmaObject);
    }
  
    return vmas;
  };
  
const fetchSnapshotData = (filePath) => {
    return fetchXmlData(filePath)
        .then(xmlDoc => parseVmaXmlToJson(xmlDoc)) // Parse the XML document to JSON
        .catch(error => {
        console.error("Error fetching and parsing the XML file: ", error);
        });
};

const readSnapshotData = (text) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  return parseVmaXmlToJson(xmlDoc);
};

export { fetchSnapshotData, fetchXmlData, parseVmaXmlToJson, readSnapshotData };