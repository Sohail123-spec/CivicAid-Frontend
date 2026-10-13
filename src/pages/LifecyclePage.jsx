import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  createLifecycleRecord, createMaintenanceRecord, createRepairRecord,
  deleteLifecycleRecord, deleteMaintenanceRecord, deleteRepairRecord,
  getLifecycleRecords, getMaintenanceRecords, getRepairRecords,
} from '../services/workspaceService.js'

const lifecycleStatuses = ['IN_USE', 'NEEDS_MAINTENANCE', 'UNDER_REPAIR', 'NEEDS_REASSESSMENT', 'REPLACED', 'DISPOSED', 'LOST', 'TRANSFERRED']
const acquisitionMethods = ['PURCHASED', 'GIFTED', 'TRANSFERRED', 'OTHER']
const acquisitionConditions = ['NEW', 'REFURBISHED', 'SECOND_HAND', 'UNKNOWN']
const maintenanceTypes = ['ROUTINE', 'PREVENTIVE', 'CLEANING', 'ADJUSTMENT', 'OTHER']
const repairStatuses = ['RESOLVED', 'PARTIALLY_RESOLVED', 'UNRESOLVED', 'REPLACEMENT_CONSIDERED']
const today = new Date().toISOString().slice(0, 10)
const pretty = (value) => value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : 'Not recorded'
const apiError = (error, fallback) => error?.response?.data?.message || error?.response?.data?.detail || fallback

function Field({ label, children, hint }) {
  return <label className="auth-field">{label}{children}{hint && <span className="auth-help-text">{hint}</span>}</label>
}

function LifecyclePage() {
  const [records, setRecords] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [maintenance, setMaintenance] = useState([])
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [retry, setRetry] = useState(0)

  async function refreshRecords(preferredId) {
    const next = await getLifecycleRecords()
    setRecords(next)
    const nextId = preferredId || selectedId
    setSelectedId(next.some((record) => record.id === nextId) ? nextId : (next[0]?.id || ''))
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError('')
      try {
        const data = await getLifecycleRecords()
        if (!cancelled) { setRecords(data); setSelectedId((current) => data.some((row) => row.id === current) ? current : (data[0]?.id || '')) }
      } catch (loadError) {
        if (!cancelled) setError(apiError(loadError, 'We could not load your device records. Please try again.'))
      } finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [retry])

  useEffect(() => {
    let cancelled = false
    async function loadHistory() {
      if (!selectedId) { setMaintenance([]); setRepairs([]); return }
      setHistoryLoading(true); setError('')
      const [maintenanceResult, repairResult] = await Promise.allSettled([getMaintenanceRecords(selectedId), getRepairRecords(selectedId)])
      if (!cancelled) {
        setMaintenance(maintenanceResult.status === 'fulfilled' ? maintenanceResult.value : [])
        setRepairs(repairResult.status === 'fulfilled' ? repairResult.value : [])
        if (maintenanceResult.status === 'rejected' || repairResult.status === 'rejected') setError('Some maintenance or repair history could not be loaded. You can retry by selecting the device again.')
        setHistoryLoading(false)
      }
    }
    loadHistory()
    return () => { cancelled = true }
  }, [selectedId])

  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId), [records, selectedId])

  async function handleCreateDevice(event) {
    event.preventDefault(); const formElement = event.currentTarget; setError(''); setNotice(''); setSaving(true)
    const form = new FormData(formElement)
    const payload = {
      itemName: String(form.get('itemName') || '').trim(),
      acquiredOn: form.get('acquiredOn'),
      acquisitionMethod: form.get('acquisitionMethod'),
      conditionAtAcquisition: form.get('conditionAtAcquisition'),
      lifecycleStatus: form.get('lifecycleStatus'),
      warrantyExpiresOn: form.get('warrantyExpiresOn') || null,
      replacementDueOn: form.get('replacementDueOn') || null,
      reassessmentDueOn: form.get('reassessmentDueOn') || null,
    }
    try {
      const created = await createLifecycleRecord(payload)
      await refreshRecords(created.id)
      formElement.reset()
      setNotice('Device record created.')
    } catch (submitError) { setError(apiError(submitError, 'We could not save this device record. Check the required fields and try again.')) }
    finally { setSaving(false) }
  }

  async function handleCreateMaintenance(event) {
    event.preventDefault(); if (!selectedId) return
    const formElement = event.currentTarget; setError(''); setNotice(''); setSaving(true)
    const form = new FormData(formElement)
    const payload = { lifecycleRecordId: selectedId, maintenanceType: form.get('maintenanceType'), maintenanceDate: form.get('maintenanceDate'), details: String(form.get('details') || '').trim() || null, nextMaintenanceDueOn: form.get('nextMaintenanceDueOn') || null }
    try {
      await createMaintenanceRecord(payload)
      setMaintenance(await getMaintenanceRecords(selectedId)); formElement.reset(); setNotice('Maintenance record added.')
    } catch (submitError) { setError(apiError(submitError, 'We could not save the maintenance record.')) }
    finally { setSaving(false) }
  }

  async function handleCreateRepair(event) {
    event.preventDefault(); if (!selectedId) return
    const formElement = event.currentTarget; setError(''); setNotice(''); setSaving(true)
    const form = new FormData(formElement)
    const cost = String(form.get('costInr') || '').trim()
    const payload = { lifecycleRecordId: selectedId, repairDate: form.get('repairDate'), issueDescription: String(form.get('issueDescription') || '').trim(), repairOutcomeStatus: form.get('repairOutcomeStatus'), workSummary: String(form.get('workSummary') || '').trim() || null, costInr: cost ? Number(cost) : null, warrantyUsed: form.get('warrantyUsed') === 'yes' ? true : form.get('warrantyUsed') === 'no' ? false : null }
    try {
      await createRepairRecord(payload)
      setRepairs(await getRepairRecords(selectedId)); formElement.reset(); setNotice('Repair record added.')
    } catch (submitError) { setError(apiError(submitError, 'We could not save the repair record. Check the required fields and try again.')) }
    finally { setSaving(false) }
  }

  async function removeDevice(record) {
    if (!window.confirm(`Delete the device record for “${record.itemName}” and its associated user-owned history?`)) return
    setError(''); setNotice('')
    try { await deleteLifecycleRecord(record.id); await refreshRecords(''); setNotice('Device record deleted.') }
    catch (deleteError) { setError(apiError(deleteError, 'Could not delete this device record.')) }
  }

  async function removeMaintenance(id) {
    if (!window.confirm('Delete this maintenance record?')) return
    try { await deleteMaintenanceRecord(id); setMaintenance(await getMaintenanceRecords(selectedId)); setNotice('Maintenance record deleted.') }
    catch (deleteError) { setError(apiError(deleteError, 'Could not delete the maintenance record.')) }
  }

  async function removeRepair(id) {
    if (!window.confirm('Delete this repair record?')) return
    try { await deleteRepairRecord(id); setRepairs(await getRepairRecords(selectedId)); setNotice('Repair record deleted.') }
    catch (deleteError) { setError(apiError(deleteError, 'Could not delete the repair record.')) }
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header"><Link className="brand" to="/" aria-label="CivicAid home"><span className="brand-mark" aria-hidden="true">C</span><span><span className="brand-name">CivicAid</span><span className="brand-caption">Assistive technology access</span></span></Link><nav className="primary-nav" aria-label="Workspace navigation"><Link to="/discover">Explore AT</Link><Link to="/schemes">Schemes &amp; Support</Link><Link to="/providers">Find Services</Link><Link to="/saved">Saved</Link><Link to="/dashboard">Dashboard</Link></nav></header>
    <main id="main-content" className="resources-section">
      <p className="eyebrow">PHASE 9 · DEVICE LIFECYCLE</p><div className="section-heading"><div><h1>My assistive technology records</h1><p>Keep acquisition, maintenance, repair and follow-up dates in one place. These are personal records; CivicAid does not certify device suitability.</p></div></div>
      {error && <section className="information-note" role="alert"><p>{error}</p>{!records.length && <button className="button button-outline" type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button>}</section>}
      {notice && <p className="success-message" role="status">{notice}</p>}
      <section className="workspace-panel"><div className="section-heading"><div><h2>Add a device record</h2><p>Enter the details you want to keep for your own records.</p></div></div>
        <form className="workspace-form" onSubmit={handleCreateDevice}>
          <Field label="Device or item name"><input className="auth-input" name="itemName" maxLength="200" required placeholder="e.g. Manual wheelchair" /></Field>
          <Field label="Acquisition date"><input className="auth-input" type="date" name="acquiredOn" max={today} required /></Field>
          <Field label="How was it acquired?"><select className="auth-input" name="acquisitionMethod" required defaultValue=""><option value="" disabled>Select a method</option>{acquisitionMethods.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></Field>
          <Field label="Condition when acquired"><select className="auth-input" name="conditionAtAcquisition" required defaultValue=""><option value="" disabled>Select a condition</option>{acquisitionConditions.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></Field>
          <Field label="Current status"><select className="auth-input" name="lifecycleStatus" required defaultValue="IN_USE">{lifecycleStatuses.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></Field>
          <Field label="Warranty expiry (optional)"><input className="auth-input" type="date" name="warrantyExpiresOn" /></Field>
          <Field label="Next reassessment (optional)"><input className="auth-input" type="date" name="reassessmentDueOn" min={today} /></Field>
          <Field label="Replacement due (optional)"><input className="auth-input" type="date" name="replacementDueOn" min={today} /></Field>
          <div className="workspace-form-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add device record'}</button></div>
        </form>
      </section>
      {loading ? <section className="information-note" aria-busy="true"><p role="status">Loading your devices…</p></section> : records.length === 0 ? <section className="information-note"><h2>No device records yet</h2><p>Use the form above to add a record. No example devices are shown because these records belong to you.</p></section> : <section className="workspace-panel"><div className="section-heading"><div><h2>Your devices</h2><p>{records.length} {records.length === 1 ? 'record' : 'records'} in your workspace</p></div><label className="auth-field">Selected device<select className="auth-input" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{records.map((record) => <option key={record.id} value={record.id}>{record.itemName}</option>)}</select></label></div>
        {selectedRecord && <article className="device-detail-card"><div className="device-detail-head"><div><h3>{selectedRecord.itemName}</h3><p className="resource-number">{pretty(selectedRecord.lifecycleStatus)}</p></div><button type="button" className="button button-outline button-danger" onClick={() => removeDevice(selectedRecord)}>Delete record</button></div><dl className="detail-list"><div><dt>Acquired</dt><dd>{selectedRecord.acquiredOn || 'Not recorded'}</dd></div><div><dt>Method</dt><dd>{pretty(selectedRecord.acquisitionMethod)}</dd></div><div><dt>Condition</dt><dd>{pretty(selectedRecord.conditionAtAcquisition)}</dd></div><div><dt>Warranty expiry</dt><dd>{selectedRecord.warrantyExpiresOn || 'Not recorded'}</dd></div><div><dt>Reassessment due</dt><dd>{selectedRecord.reassessmentDueOn || 'Not recorded'}</dd></div><div><dt>Replacement due</dt><dd>{selectedRecord.replacementDueOn || 'Not recorded'}</dd></div></dl></article>}
        {historyLoading ? <p role="status">Loading device history…</p> : <div className="history-grid"><section className="history-panel"><h3>Maintenance history</h3>{maintenance.length ? <ul className="history-list">{maintenance.map((item) => <li key={item.id}><div><strong>{pretty(item.maintenanceType)}</strong><span>{item.maintenanceDate}</span><p>{item.details || 'No additional details recorded.'}</p>{item.nextMaintenanceDueOn && <p>Next maintenance due: {item.nextMaintenanceDueOn}</p>}</div><button type="button" className="text-button-danger" onClick={() => removeMaintenance(item.id)}>Delete</button></li>)}</ul> : <p>No maintenance records for this device yet.</p>}
          <form className="stacked-form" onSubmit={handleCreateMaintenance}><h4>Add maintenance record</h4><Field label="Maintenance type"><select className="auth-input" name="maintenanceType" required>{maintenanceTypes.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></Field><Field label="Maintenance date"><input className="auth-input" type="date" name="maintenanceDate" max={today} required /></Field><Field label="Details (optional)"><textarea className="auth-input" name="details" rows="3" maxLength="1000" /></Field><Field label="Next maintenance due (optional)"><input className="auth-input" type="date" name="nextMaintenanceDueOn" min={today} /></Field><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add maintenance'}</button></form></section>
          <section className="history-panel"><h3>Repair history</h3>{repairs.length ? <ul className="history-list">{repairs.map((item) => <li key={item.id}><div><strong>{item.issueDescription}</strong><span>{item.repairDate} · {pretty(item.repairOutcomeStatus)}</span><p>{item.workSummary || 'No work summary recorded.'}</p>{item.costInr != null && <p>Recorded cost: ₹{item.costInr}</p>}{item.warrantyUsed != null && <p>Warranty used: {item.warrantyUsed ? 'Yes' : 'No'}</p>}</div><button type="button" className="text-button-danger" onClick={() => removeRepair(item.id)}>Delete</button></li>)}</ul> : <p>No repair records for this device yet.</p>}
          <form className="stacked-form" onSubmit={handleCreateRepair}><h4>Add repair record</h4><Field label="Repair date"><input className="auth-input" type="date" name="repairDate" max={today} required /></Field><Field label="Issue description"><textarea className="auth-input" name="issueDescription" rows="3" maxLength="1000" required /></Field><Field label="Outcome"><select className="auth-input" name="repairOutcomeStatus" required>{repairStatuses.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></Field><Field label="Work summary (optional)"><textarea className="auth-input" name="workSummary" rows="3" maxLength="1000" /></Field><Field label="Cost in INR (optional)"><input className="auth-input" type="number" name="costInr" min="0" step="0.01" /></Field><Field label="Warranty used?"><select className="auth-input" name="warrantyUsed" defaultValue=""><option value="">Not recorded</option><option value="yes">Yes</option><option value="no">No</option></select></Field><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add repair'}</button></form></section></div>}
      </section>}
      <p className="trust-disclaimer">Keep only information you need. For urgent device issues or service advice, contact your provider or relevant professional directly.</p>
    </main><footer className="site-footer"><Link className="footer-brand" to="/">CivicAid</Link><p>Support through every stage of the assistive technology journey.</p></footer>
  </div>
}

export default LifecyclePage
