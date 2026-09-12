'use client';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from './api';
export const useDashboard = (year: number) =>
  useQuery({ queryKey: ['dashboard', year], queryFn: () => reportsApi.dashboard(year) });
export const useEuer = (year: number) =>
  useQuery({ queryKey: ['reports', 'euer', year], queryFn: () => reportsApi.euer(year) });
export const useVat = (year: number) =>
  useQuery({ queryKey: ['reports', 'vat', year], queryFn: () => reportsApi.vat(year) });
