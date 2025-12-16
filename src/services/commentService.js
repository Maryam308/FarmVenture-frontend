const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/hoots`;

const create = async (hootId, commentFormData) => {
    try {
      const res = await fetch(`${BASE_URL}/${hootId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentFormData)
      });
      return res.json();
    } catch (error) {
      console.log(error);
    }
};

const remove = async (hootId, commentId) => {
  try {
    const res = await fetch(`${BASE_URL}/${hootId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return res.json();
  } catch (error) {
    console.log(error);
  };
};

const update = async (hootId, commentId, commentFormData) => {
  try {
    const res = await fetch(`${BASE_URL}/${hootId}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentFormData),
    });
    return res.json();
  } catch (error) {
    console.log(error);
  };
};

export { create, remove, update }