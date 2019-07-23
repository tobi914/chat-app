const generateMessage = (text, username = 'System') => {
  return {
    username,
    text,
    createdAt: new Date().getTime()
  }
};

const generateLocationMessage = (url, username = 'System') => {
  return {
    username,
    url,
    createdAt: new Date().getTime()
  }
};

module.exports = {
  generateMessage,
  generateLocationMessage
};
