create table daftar_pasien (
  id_pasien bigint generated always as identity primary key,
  nama text not null,
  umur int not null,
  aktif boolean not null default true
);

create table daftar_pegawai (
  id_pegawai bigint generated always as identity primary key,
  nama text not null,
  kode text not null,
  aktif boolean not null default true
);

create table sabr_report (
  id_report bigint generated always as identity primary key,
  tanggal_shift date not null,
  shift text not null check (shift in ('pagi', 'siang', 'malam')),
  pasien_id bigint not null references daftar_pasien(id_pasien),
  situation text,
  assessment text,
  background text,
  recommendation text,
  updated_at timestamptz not null default now(),
  unique (tanggal_shift, shift, pasien_id)
);

create table shift_handler (
  id_shift bigint generated always as identity primary key, 
  tanggal_shift date not null,
  shift text not null check (shift in ('pagi', 'siang', 'malam')),
  shift_leader boolean not null default false,
  pegawai_id bigint not null references daftar_pegawai(id_pegawai),
  unique (tanggal_shift, shift, pegawai_id)
);

create unique index satu_leader_per_shift 
    on shift_handler (tanggal_shift, shift) where shift_leader;