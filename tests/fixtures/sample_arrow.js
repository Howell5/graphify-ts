
const fetchData = async (url) => {
  const response = await fetch(url);
  return response.json();
};

const processItem = (item) => {
  return transform(item);
};
