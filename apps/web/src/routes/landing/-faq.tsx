import { motion } from 'motion/react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@cared/ui/components/accordion'

const FAQ_ITEMS = [
  {
    question: 'What is Cared?',
    answer:
      'Cared is an all-in-one infrastructure platform for AI agents. You get a unified API for models (gateway), tools, MCP, sandboxes, vector store, database, object storage, app deployment, and auth—with one API key and one account.',
  },
  {
    question: 'How does billing work?',
    answer:
      'You can use pay-as-you-go (per request) or subscription plans. Usage is metered; you only pay for what you use on pay-as-you-go. Subscriptions include a base allowance and optional overages.',
  },
  {
    question: 'Can I use my own API keys?',
    answer:
      'Yes. You can bring your own provider keys for models and still use Cared for routing, tools, sandboxes, database, and storage. Your keys stay in your account and are not shared.',
  },
  {
    question: 'Is there a free tier?',
    answer:
      'Check the dashboard and docs for current offers. We aim to make it easy to try the full stack with minimal commitment.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Sign up, get your API key from the dashboard, and add it to your app. Use the same key for gateway, tools, sandboxes, and other services. See the docs for SDK and API references.',
  },
] as const

export function LandingFaq() {
  return (
    <section className="border-b border-border bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 font-sans text-muted-foreground">
            Common questions about Cared and how it works.
          </p>
        </motion.div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="font-mono text-left text-sm font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
