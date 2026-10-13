import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { saveResource } from '../services/workspaceService.js'

function SaveResourceButton({ resourceType, resourceId }) {
  const { isAuthenticated, isLoading } = useAuth()
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')

  if (isLoading) return null
  if (!isAuthenticated) return <Link className="text-link" to="/login">Sign in to save</Link>

  async function handleSave() {
    setState('saving')
    setMessage('')
    try {
      await saveResource(resourceType, resourceId)
      setState('saved')
      setMessage('Saved to your resources.')
    } catch (error) {
      setState('idle')
      setMessage(error?.response?.status === 409 ? 'This resource is already saved.' : (error?.response?.data?.message || 'Could not save this resource. Please try again.'))
    }
  }

  return (
    <div className="save-resource-control">
      <button className="button button-outline" type="button" onClick={handleSave} disabled={state === 'saving' || state === 'saved'}>
        {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : 'Save resource'}
      </button>
      {message && <p className="inline-status" role="status">{message}</p>}
    </div>
  )
}

export default SaveResourceButton
