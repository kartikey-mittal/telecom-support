import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-gray-300" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 text-center max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
