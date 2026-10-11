import { translate, type Lang } from '../i18n'
import { fmt } from './ghats'
import type { ActionCode, GhatRisk, PlanView } from '../types'

/** Whether an action applies to a ghat: the officer's saved plan if there is one, else the data's suggestion. */
export function chosen(g: GhatRisk, plan: PlanView | undefined, action: ActionCode): boolean {
  if (plan?.saved) {
    return action === 'AERATION' ? plan.aeration : action === 'CLEANING' ? plan.cleaning : plan.extraTesting
  }
  return g.suggestedActions.some((a) => a.action === action)
}

export function actionsFor(g: GhatRisk, plan: PlanView | undefined): ActionCode[] {
  return (['AERATION', 'CLEANING', 'EXTRA_TESTING'] as const).filter((a) => chosen(g, plan, a))
}

/** The numbered recommendations shown on the brief page and in the printed brief. */
export function buildRecommendations(lang: Lang, ghats: GhatRisk[], plans: Record<string, PlanView>): string[] {
  const name = (g: GhatRisk) => (lang === 'hi' ? g.nameHi : g.name)
  const names = (list: GhatRisk[]) => list.map(name).join(', ')
  const withAction = (a: ActionCode) => ghats.filter((g) => chosen(g, plans[g.ghatId], a))

  const recs: string[] = []
  if (ghats[0]) recs.push(translate(lang, 'recFirst', { name: name(ghats[0]), score: fmt(ghats[0].score, 1) }))
  if (withAction('AERATION').length) recs.push(translate(lang, 'recAeration', { list: names(withAction('AERATION')) }))
  if (withAction('CLEANING').length) recs.push(translate(lang, 'recCleaning', { list: names(withAction('CLEANING')) }))
  const gappy = ghats.filter((g) => g.coverage.gaps.length > 0)
  if (gappy.length) recs.push(translate(lang, 'recTesting', { list: names(gappy) }))
  const uncertain = ghats.filter((g) => g.siteMatchConfidence !== 'high')
  if (uncertain.length) recs.push(translate(lang, 'recSite', { list: names(uncertain) }))
  return recs
}
