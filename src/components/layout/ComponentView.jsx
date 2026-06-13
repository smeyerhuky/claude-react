import PropTypes from 'prop-types'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { navigationItems } from '../../config/navigation'

function BackButton({ onClick, label = 'Back' }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700
                 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100
                 transition-colors touch-manipulation min-h-[44px]"
      aria-label="Go back to home"
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
      <span>{label}</span>
    </button>
  )
}

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string,
}

function FullscreenView({ item, onBack }) {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-auto">
      <button
        onClick={onBack}
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-1.5 px-3 py-2
                   text-sm font-medium text-white bg-black/50 backdrop-blur-sm
                   border border-white/20 rounded-lg hover:bg-black/70
                   active:bg-black/80 transition-colors touch-manipulation min-h-[44px]"
        aria-label="Go back to home"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        <span>Back</span>
      </button>
      <item.component />
    </div>
  )
}

const navItemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  component: PropTypes.elementType.isRequired,
  fullscreen: PropTypes.bool,
})

FullscreenView.propTypes = {
  item: navItemShape.isRequired,
  onBack: PropTypes.func.isRequired,
}

function StandardView({ item, onBack }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky mobile-friendly toolbar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shadow-sm">
        <BackButton onClick={onBack} label="Home" />
        <h2 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{item.label}</h2>
      </div>
      <div className="flex-1 p-4">
        <item.component />
      </div>
    </div>
  )
}

StandardView.propTypes = {
  item: navItemShape.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default function ComponentView() {
  const { componentId } = useParams()
  const navigate = useNavigate()
  const item = navigationItems.find(n => n.id === componentId)

  if (!item) return <Navigate to="/" />

  const handleBack = () => navigate('/')

  if (item.fullscreen) {
    return <FullscreenView item={item} onBack={handleBack} />
  }

  return <StandardView item={item} onBack={handleBack} />
}
