import { useEffect, useState } from "react";
import config from '../configs/config'
import axios from "axios";

export function useAxios({url, method='GET', body={}}){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null)

  const baseURL = `${config.REACT_BASE_URL}/${url}`
  
  useEffect( ()=> {
    if(method === 'GET'){
      axios.get(baseURL)
      .then(result => {
        setData(result.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
      })
    }else if (method === 'POST'){
  
    }else if (method === 'PATCH'){
      axios.patch(baseURL)
      .then(result => {
        setData(result.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
      })
    }else if (method === 'DELETE'){
  
    }
  }, [])
  
  return [
    data, loading, error
  ]
}