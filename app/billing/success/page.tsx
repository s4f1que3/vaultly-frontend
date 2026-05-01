'use client';

import { Suspense } from 'react';
import BillingSuccessContent from './content';

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">Loading...</div>}>
      <BillingSuccessContent />
    </Suspense>
  );
}
              Try again
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
